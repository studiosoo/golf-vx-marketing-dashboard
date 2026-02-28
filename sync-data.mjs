/**
 * sync-data.mjs
 * Syncs Boomerang member data and restores campaign data into the DB.
 * Run: node sync-data.mjs
 */
import { createConnection } from "mysql2/promise";

const DATABASE_URL = "mysql://2R3ugynrRDzjYQU.e9d0c4c091a8:UKt4D67fFeSzVn6l2Oq3@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/A5GjFitCrpqWQ2wnoTJiWm?ssl={\"rejectUnauthorized\":true}";
const BOOMERANG_TOKEN = "41f8837d95b8599a165d97029a2ba5bc";
const BOOMERANG_BASE = "https://app.boomerangme.cards/api/v1";

const conn = await createConnection(DATABASE_URL);
console.log("✓ DB connected");

// ── Helper: Boomerang POST request ────────────────────────────────────────
async function boomerangPost(method, params = {}) {
  const url = `${BOOMERANG_BASE}/${method}`;
  const body = { token: BOOMERANG_TOKEN, ...params };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": BOOMERANG_TOKEN,
      "x-access-token": BOOMERANG_TOKEN,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Boomerang ${method} failed: ${res.status} ${text.substring(0, 100)}`);
  }
  return res.json();
}

// ── Helper: Boomerang GET request ─────────────────────────────────────────
async function boomerangGet(method, params = {}) {
  const url = new URL(`${BOOMERANG_BASE}/${method}`);
  url.searchParams.set("token", BOOMERANG_TOKEN);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Boomerang ${method} GET failed: ${res.status} ${text.substring(0, 100)}`);
  }
  return res.json();
}

// ── 1. Get templates ──────────────────────────────────────────────────────
// We already know the templates from the previous test
const templates = [
  { id: 340717, name: "Swing Savers", type: 6 },
  { id: 341133, name: "All-Access Aces", type: 6 },
  { id: 341134, name: "Pro Membership", type: 6 },
  { id: 343984, name: "Swing Savers - Fam", type: 6 },
  { id: 343985, name: "All-Access Aces - Fam", type: 6 },
  { id: 346021, name: "All-Access Aces - Employee", type: 6 },
  { id: 359801, name: "Swing Savers - Black Friday", type: 6 },
  { id: 497225, name: "All-Access Aces 325", type: 6 },
  { id: 497227, name: "Swing Savers 225", type: 6 },
  { id: 528426, name: "Summer Pass - 750", type: 6 },
  { id: 865726, name: "Swing Savers Trial", type: 6 },
  { id: 865727, name: "All-Access Aces Trial", type: 6 },
  { id: 953012, name: "All-Access Aces 325 copy", type: 6 },
];

// Determine tier and amount from template name
function getTierInfo(templateName) {
  const n = templateName.toLowerCase();
  if (n.includes("trial")) {
    return { tier: "trial", amount: 0 };
  }
  if (n.includes("pro")) {
    return { tier: "golf_vx_pro", amount: 500 };
  }
  if (n.includes("all-access") || n.includes("all access")) {
    if (n.includes("325")) return { tier: "all_access_aces", amount: 325 };
    return { tier: "all_access_aces", amount: 325 };
  }
  if (n.includes("swing saver") || n.includes("swing-saver")) {
    if (n.includes("225")) return { tier: "swing_savers", amount: 225 };
    if (n.includes("black friday")) return { tier: "swing_savers", amount: 225 };
    return { tier: "swing_savers", amount: 225 };
  }
  if (n.includes("summer pass")) {
    return { tier: "swing_savers", amount: 750 };
  }
  return { tier: "swing_savers", amount: 225 };
}

// ── 2. Get clients for each template ─────────────────────────────────────
let totalSynced = 0;
const tierCounts = { all_access_aces: 0, swing_savers: 0, golf_vx_pro: 0, trial: 0 };

// Only sync active membership templates (not trials)
const activeTemplates = templates.filter(t => !t.name.toLowerCase().includes("trial") && !t.name.toLowerCase().includes("copy"));

for (const tmpl of activeTemplates) {
  const { tier, amount } = getTierInfo(tmpl.name);
  console.log(`\nFetching clients for template ${tmpl.id} (${tmpl.name}) → ${tier} $${amount}/mo...`);
  
  let clients = [];
  try {
    // Try GET with templateId param
    const data = await boomerangGet("getClientsList", { templateId: tmpl.id });
    clients = data?.result || data?.clients || [];
    console.log(`  → ${clients.length} clients via GET`);
  } catch (e) {
    console.warn(`  GET failed: ${e.message}`);
    try {
      const data = await boomerangPost("getClientsList", { templateId: tmpl.id });
      clients = data?.result || data?.clients || [];
      console.log(`  → ${clients.length} clients via POST`);
    } catch (e2) {
      console.error(`  Both methods failed: ${e2.message}`);
      continue;
    }
  }

  for (const client of clients) {
    const email = client.email?.trim() || null;
    const phone = client.phone?.trim() || null;
    if (!email && !phone) continue;

    const firstName = client.fName?.trim() || "";
    const lastName = client.sName?.trim() || "";
    const name = `${firstName} ${lastName}`.trim() || email || "Unknown";

    // Check if member exists by email or phone
    let existing = [];
    if (email) {
      const [rows] = await conn.execute("SELECT id FROM members WHERE email = ?", [email]);
      existing = rows;
    }
    if (existing.length === 0 && phone) {
      const [rows] = await conn.execute("SELECT id FROM members WHERE phone = ? AND phone IS NOT NULL AND phone != ''", [phone]);
      existing = rows;
    }

    if (existing.length > 0) {
      await conn.execute(
        `UPDATE members SET name = ?, firstName = ?, lastName = ?, membershipTier = ?, status = 'active', monthlyAmount = ?, updatedAt = NOW() WHERE id = ?`,
        [name, firstName, lastName, tier, amount, existing[0].id]
      );
    } else {
      try {
        await conn.execute(
          `INSERT INTO members (name, firstName, lastName, email, phone, membershipTier, status, monthlyAmount, joinDate, acquisitionSource, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, 'active', ?, NOW(), 'boomerang', NOW(), NOW())`,
          [name, firstName, lastName, email, phone, tier, amount]
        );
      } catch (e) {
        if (!e.message.includes("Duplicate") && !e.message.includes("1062")) {
          console.error(`  Error inserting ${email || phone}:`, e.message);
        }
      }
    }
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    totalSynced++;
  }
}

console.log(`\n✓ Member sync complete: ${totalSynced} members processed`);
console.log("  Tier breakdown:", tierCounts);

// ── 3. Restore campaigns ──────────────────────────────────────────────────
console.log("\nRestoring campaigns...");
const [existingCampaigns] = await conn.execute("SELECT COUNT(*) as cnt FROM campaigns");
const campaignCount = Number(existingCampaigns[0].cnt);
console.log(`Current campaigns in DB: ${campaignCount}`);

if (campaignCount === 0) {
  const campaigns = [
    ["Junior Summer Camp", "membership_acquisition", "active", 500, 290.16, "2026-01-01", "2026-06-30", "Junior golf summer camp program targeting families"],
    ["IG $100 Giveaway", "membership_acquisition", "completed", 600, 462.18, "2026-01-15", "2026-02-15", "Instagram $100 gift card giveaway campaign"],
    ["Superbowl Watch Party", "corporate_events", "completed", 200, 75.43, "2026-02-09", "2026-02-09", "Super Bowl watch party event at Golf VX"],
    ["PBGA Winter Clinic", "membership_acquisition", "completed", 300, 150, "2026-01-10", "2026-01-31", "PBGA winter golf clinic program"],
    ["Instagram Follower Growth", "membership_acquisition", "paused", 400, 116, "2026-01-01", "2026-03-31", "Organic + paid Instagram follower growth campaign"],
    ["Drive Day Events", "trial_conversion", "active", 500, 200, "2026-01-01", "2026-12-31", "Monthly Drive Day events to convert trials to members"],
    ["Corporate Events B2B", "corporate_events", "active", 1000, 0, "2026-01-01", "2026-12-31", "B2B corporate event outreach and partnerships"],
    ["Sunday Clinic League", "membership_acquisition", "active", 300, 0, "2026-01-01", "2026-12-31", "Weekly Sunday golf clinic league program"],
    ["National League", "member_retention", "active", 500, 0, "2026-01-01", "2026-12-31", "National Golf VX League competition"],
  ];
  for (const c of campaigns) {
    await conn.execute(
      `INSERT INTO campaigns (name, category, status, budget, actualSpend, startDate, endDate, description, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      c
    );
  }
  console.log(`✓ Inserted ${campaigns.length} campaigns`);
} else {
  console.log("Campaigns already exist, skipping");
}

// ── 4. Final verification ─────────────────────────────────────────────────
const [memberStats] = await conn.execute(`
  SELECT
    COUNT(CASE WHEN membershipTier = 'all_access_aces' AND status = 'active' THEN 1 END) as allAccess,
    COUNT(CASE WHEN membershipTier = 'swing_savers' AND status = 'active' THEN 1 END) as swingSaver,
    COUNT(CASE WHEN membershipTier = 'golf_vx_pro' AND status = 'active' THEN 1 END) as pro,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as total,
    COALESCE(SUM(CASE WHEN status = 'active' THEN COALESCE(monthlyAmount, 0) ELSE 0 END), 0) as mrr
  FROM members
`);
const [campaignStats] = await conn.execute("SELECT COUNT(*) as total, COUNT(CASE WHEN status='active' THEN 1 END) as active FROM campaigns");

console.log("\n=== Final DB State ===");
console.log("Members:", memberStats[0]);
console.log("Campaigns:", campaignStats[0]);

await conn.end();
console.log("\n✓ Done!");
