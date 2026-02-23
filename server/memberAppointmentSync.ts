import { getAppointments } from "./acuity";
import * as db from "./db";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { memberAppointments, members, campaigns } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

const connection = mysql.createPool(process.env.DATABASE_URL!);
const dbClient = drizzle(connection);

/**
 * Sync Acuity appointments with member records
 * - Creates/updates member records for Acuity customers
 * - Links appointments to members and campaigns
 * - Tracks appointment history for each member
 */
export async function syncAcuityAppointments() {
  console.log("Starting Acuity appointment sync...");
  
  // Fetch appointments from last 90 days
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 90);
  
  const appointments = await getAppointments({
    minDate: minDate.toISOString().split('T')[0],
    canceled: false
  });
  
  console.log(`Fetched ${appointments.length} appointments from Acuity`);
  
  let newMembers = 0;
  let newAppointments = 0;
  let updatedAppointments = 0;
  
  for (const apt of appointments) {
    try {
      // Find or create member by email
      let member = await dbClient.select().from(members).where(eq(members.email, apt.email)).limit(1);
      
      if (member.length === 0) {
        // Create new member
        const [newMember] = await dbClient.insert(members).values({
          name: `${apt.firstName} ${apt.lastName}`,
          email: apt.email,
          phone: apt.phone || null,
          membershipTier: "trial",
          status: "active",
          joinDate: new Date(apt.dateCreated),
          acquisitionSource: "acuity",
          acuityClientId: apt.id.toString(),
          totalLessons: 1,
          lastLessonDate: new Date(apt.datetime),
          lastAcuitySync: new Date(),
        });
        
        member = await dbClient.select().from(members).where(eq(members.id, newMember.insertId));
        newMembers++;
      } else {
        // Update existing member
        await dbClient.update(members)
          .set({
            acuityClientId: apt.id.toString(),
            lastLessonDate: new Date(apt.datetime),
            lastAcuitySync: new Date(),
          })
          .where(eq(members.id, member[0].id));
      }
      
      const memberId = member[0].id;
      
      // Try to match appointment to campaign by appointment type
      let campaignId: number | null = null;
      const allCampaigns = await db.getAllCampaigns();
      
      // Match by appointment type name
      const matchedCampaign = allCampaigns.find(c => 
        apt.type.toLowerCase().includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(apt.type.toLowerCase())
      );
      
      if (matchedCampaign) {
        campaignId = matchedCampaign.id;
      }
      
      // Check if appointment already exists
      const existing = await dbClient.select()
        .from(memberAppointments)
        .where(eq(memberAppointments.acuityAppointmentId, apt.id))
        .limit(1);
      
      if (existing.length === 0) {
        // Create new appointment record
        await dbClient.insert(memberAppointments).values({
          memberId,
          campaignId,
          acuityAppointmentId: apt.id,
          appointmentType: apt.type,
          appointmentTypeId: apt.appointmentTypeID,
          category: apt.category || null,
          appointmentDate: new Date(apt.datetime),
          dateCreated: new Date(apt.dateCreated),
          duration: parseInt(apt.duration),
          price: apt.price,
          amountPaid: apt.amountPaid || "0",
          paid: apt.paid === "yes",
          canceled: apt.canceled,
          completed: new Date(apt.datetime) < new Date(),
          notes: apt.notes || null,
          location: apt.location || null,
          calendar: apt.calendar || null,
        });
        newAppointments++;
      } else {
        // Update existing appointment
        await dbClient.update(memberAppointments)
          .set({
            campaignId,
            amountPaid: apt.amountPaid || "0",
            paid: apt.paid === "yes",
            canceled: apt.canceled,
            completed: new Date(apt.datetime) < new Date(),
          })
          .where(eq(memberAppointments.acuityAppointmentId, apt.id));
        updatedAppointments++;
      }
      
    } catch (error) {
      console.error(`Error syncing appointment ${apt.id}:`, error);
    }
  }
  
  console.log(`Sync complete: ${newMembers} new members, ${newAppointments} new appointments, ${updatedAppointments} updated`);
  
  return {
    totalAppointments: appointments.length,
    newMembers,
    newAppointments,
    updatedAppointments
  };
}

/**
 * Get appointment history for a specific member
 */
export async function getMemberAppointments(memberId: number) {
  return await dbClient.select()
    .from(memberAppointments)
    .where(eq(memberAppointments.memberId, memberId))
    .orderBy(memberAppointments.appointmentDate);
}

/**
 * Get all appointments for a specific campaign
 */
export async function getCampaignAppointments(campaignId: number) {
  return await dbClient.select()
    .from(memberAppointments)
    .where(eq(memberAppointments.campaignId, campaignId))
    .orderBy(memberAppointments.appointmentDate);
}
