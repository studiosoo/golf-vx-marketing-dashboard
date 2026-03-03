import { getDb } from "./db";
import { members, memberTransactions } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

// Toast API configuration
const TOAST_API_BASE = "https://ws-api.toasttab.com";
const TOAST_API_TOKEN = process.env.TOAST_API_TOKEN;
const TOAST_RESTAURANT_GUID = process.env.TOAST_RESTAURANT_GUID;

interface ToastOrder {
  guid: string;
  checkNumber: string;
  openedDate: string;
  closedDate?: string;
  modifiedDate: string;
  businessDate: string;
  checks: ToastCheck[];
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

interface ToastCheck {
  guid: string;
  selections: ToastSelection[];
  payments: ToastPayment[];
  amount: number;
  tax: number;
  tip: number;
  totalAmount: number;
  appliedDiscounts?: any[];
}

interface ToastSelection {
  guid: string;
  itemGuid: string;
  name: string;
  quantity: number;
  price: number;
  modifiers?: any[];
}

interface ToastPayment {
  guid: string;
  type: string;
  amount: number;
  tipAmount?: number;
  paidDate: string;
  refund?: {
    refundStatus: string;
  };
}

/**
 * Fetch orders from Toast POS API for a date range
 */
export async function fetchToastOrders(
  startDate: Date,
  endDate: Date
): Promise<ToastOrder[]> {
  if (!TOAST_API_TOKEN || !TOAST_RESTAURANT_GUID) {
    throw new Error("Toast API credentials not configured");
  }

  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  try {
    const response = await fetch(
      `${TOAST_API_BASE}/orders/v2/orders?restaurantGuid=${TOAST_RESTAURANT_GUID}&startDate=${startDateStr}&endDate=${endDateStr}`,
      {
        headers: {
          Authorization: `Bearer ${TOAST_API_TOKEN}`,
          "Toast-Restaurant-External-ID": TOAST_RESTAURANT_GUID,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Toast API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data as ToastOrder[];
  } catch (error) {
    console.error("Error fetching Toast orders:", error);
    throw error;
  }
}

/**
 * Find or create member from Toast customer data
 */
async function findOrCreateMemberFromToastCustomer(
  customer: ToastOrder["customer"],
  orderDate: Date
): Promise<number | null> {
  if (!customer || !customer.email) {
    return null;
  }

  // Try to find existing member by email
  const db = await getDb();
  if (!db) return null;
  
  const existingMembers = await db
    .select()
    .from(members)
    .where(eq(members.email, customer.email))
    .limit(1);

  if (existingMembers.length > 0) {
    return existingMembers[0].id;
  }

  // Create new member from Toast customer data
  const name = `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Toast Customer";
  
  const [newMember] = await db
    .insert(members)
    .values({
      name,
      email: customer.email,
      phone: customer.phone || null,
      membershipTier: "none",
      status: "active",
      joinDate: orderDate,
      acquisitionSource: "toast_pos",
    })
    .$returningId();

  return newMember.id;
}

/**
 * Determine payment status from Toast payment data
 */
function getPaymentStatus(payments: ToastPayment[]): "paid" | "pending" | "refunded" | "voided" {
  if (!payments || payments.length === 0) {
    return "pending";
  }

  // Check if any payment is refunded
  const hasRefund = payments.some(
    (p) => p.refund && p.refund.refundStatus === "APPROVED"
  );
  if (hasRefund) {
    return "refunded";
  }

  // Check if all payments are completed
  const allPaid = payments.every((p) => p.paidDate);
  return allPaid ? "paid" : "pending";
}

/**
 * Categorize items from Toast order
 */
function categorizeItems(selections: ToastSelection[]): string {
  if (!selections || selections.length === 0) {
    return "other";
  }

  // Simple categorization based on item names
  const itemNames = selections.map((s) => s.name.toLowerCase()).join(" ");

  if (itemNames.includes("food") || itemNames.includes("burger") || itemNames.includes("sandwich")) {
    return "food";
  }
  if (itemNames.includes("drink") || itemNames.includes("beverage") || itemNames.includes("beer") || itemNames.includes("wine")) {
    return "beverage";
  }
  if (itemNames.includes("merchandise") || itemNames.includes("shirt") || itemNames.includes("hat")) {
    return "merchandise";
  }

  return "food_beverage";
}

/**
 * Sync Toast orders to memberTransactions table
 */
export async function syncToastTransactions(
  startDate: Date,
  endDate: Date
): Promise<{
  synced: number;
  skipped: number;
  errors: string[];
}> {
  const results = {
    synced: 0,
    skipped: 0,
    errors: [] as string[],
  };

  try {
    console.log(`Fetching Toast orders from ${startDate.toISOString()} to ${endDate.toISOString()}...`);
    const orders = await fetchToastOrders(startDate, endDate);
    console.log(`Fetched ${orders.length} orders from Toast POS`);

    for (const order of orders) {
      try {
        // Find or create member from customer data
        const memberId = await findOrCreateMemberFromToastCustomer(
          order.customer,
          new Date(order.openedDate)
        );

        if (!memberId) {
          results.skipped++;
          continue;
        }

        // Process each check in the order
        for (const check of order.checks) {
          // Check if transaction already exists
          const db = await getDb();
          if (!db) {
            results.skipped++;
            continue;
          }
          
          const existing = await db
            .select()
            .from(memberTransactions)
            .where(eq(memberTransactions.toastOrderGuid, check.guid))
            .limit(1);

          if (existing.length > 0) {
            results.skipped++;
            continue;
          }

          // Calculate totals
          const amount = check.amount || 0;
          const tax = check.tax || 0;
          const tip = check.tip || 0;
          const total = check.totalAmount || amount + tax + tip;

          // Determine payment method and status
          const paymentMethod = check.payments?.[0]?.type || "unknown";
          const paymentStatus = getPaymentStatus(check.payments);

          // Categorize items
          const category = categorizeItems(check.selections);
          const itemCount = check.selections?.reduce((sum, s) => sum + (s.quantity || 1), 0) || 0;

          // Insert transaction
          await db.insert(memberTransactions).values({
            memberId,
            toastOrderGuid: check.guid,
            toastCheckNumber: order.checkNumber,
            transactionDate: new Date(order.closedDate || order.openedDate),
            amount: amount.toString(),
            tax: tax.toString(),
            tip: tip.toString(),
            total: total.toString(),
            paymentMethod,
            paymentStatus,
            items: JSON.stringify(check.selections),
            itemCount,
            category,
            venue: "Arlington Heights",
            lastSyncedAt: new Date(),
          });

          results.synced++;
        }
      } catch (error) {
        console.error(`Error syncing order ${order.guid}:`, error);
        results.errors.push(`Order ${order.guid}: ${error}`);
      }
    }

    console.log(`Toast sync complete: ${results.synced} synced, ${results.skipped} skipped, ${results.errors.length} errors`);
    return results;
  } catch (error) {
    console.error("Error in syncToastTransactions:", error);
    throw error;
  }
}

/**
 * Get transaction history for a specific member
 */
export async function getMemberTransactions(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(memberTransactions)
    .where(eq(memberTransactions.memberId, memberId));
}

/**
 * Get transaction statistics for a member
 */
export async function getMemberTransactionStats(memberId: number) {
  const transactions = await getMemberTransactions(memberId);

  const totalSpent = transactions.reduce(
    (sum: number, t: any) => sum + parseFloat(t.total),
    0
  );
  const totalTransactions = transactions.length;
  const avgTransactionValue = totalTransactions > 0 ? totalSpent / totalTransactions : 0;

  const lastTransaction = transactions[transactions.length - 1];
  const lastTransactionDate = lastTransaction?.transactionDate || null;

  return {
    totalSpent,
    totalTransactions,
    avgTransactionValue,
    lastTransactionDate,
  };
}
