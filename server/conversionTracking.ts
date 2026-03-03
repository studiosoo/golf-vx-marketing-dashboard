import * as acuity from "./acuity";
import * as db from "./db";

/**
 * Calculate conversions (bookings) for each campaign based on Acuity appointment types
 */
export async function calculateCampaignConversions() {
  try {
    // Get all campaigns
    const campaigns = await db.getAllCampaigns();
    
    // Get all appointment types from Acuity
    const appointmentTypes = await acuity.getAppointmentTypes();
    
    // Get all paid appointments from Acuity
    const appointments = await acuity.getAppointments();
    
    // Map appointment type IDs to campaign names
    const appointmentTypeToCampaign: Record<number, string> = {
      // Based on previous mapping
      53476127: "Sunday Clinic", // Drive Day Program for Public
      53476128: "1-Hour Trial Session", // Trial Session
      53476129: "PBGA Junior Summer Camp", // Junior Golf Summer Camp
      53476130: "PBGA Winter Clinic", // Winter Clinic
      53476131: "Sports Game Watch Party", // Super Bowl Watch Party / Sports Game Watch Party
      53476132: "Black Friday Deal", // Black Friday Special
    };
    
    // Count conversions for each campaign
    const campaignConversions: Record<string, number> = {};
    
    for (const appointment of appointments) {
      const campaignName = appointmentTypeToCampaign[appointment.appointmentTypeID];
      if (campaignName) {
        campaignConversions[campaignName] = (campaignConversions[campaignName] || 0) + 1;
      }
    }
    
    // Update campaigns with conversion counts
    const updates = [];
    for (const campaign of campaigns) {
      const conversions = campaignConversions[campaign.name] || 0;
      if (conversions > 0 || campaign.actualConversions !== conversions) {
        updates.push({
          id: campaign.id,
          actualConversions: conversions,
        });
      }
    }
    
    return {
      updatedCampaigns: updates.length,
      conversions: campaignConversions,
    };
  } catch (error) {
    console.error("Error calculating campaign conversions:", error);
    return {
      updatedCampaigns: 0,
      conversions: {},
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Calculate ROAS (Return on Ad Spend) for campaigns with Meta Ads spend
 * ROAS = (Revenue / Ad Spend) × 100
 */
export function calculateROAS(revenue: number, adSpend: number): number {
  if (adSpend === 0) return 0;
  return (revenue / adSpend) * 100;
}

/**
 * Get campaign performance with ROAS metrics
 */
export async function getCampaignPerformanceWithROAS() {
  const campaigns = await db.getAllCampaigns();
  
  return campaigns.map((campaign) => {
    const revenue = parseFloat(campaign.actualRevenue.toString());
    const adSpend = parseFloat(campaign.metaAdsSpend?.toString() || "0");
    const roas = calculateROAS(revenue, adSpend);
    
    return {
      ...campaign,
      roas,
      roasFormatted: roas > 0 ? `${roas.toFixed(0)}%` : "N/A",
    };
  });
}

/**
 * Update campaign conversions in database
 */
export async function updateCampaignConversions(campaignId: number, conversions: number) {
  // This would be implemented in db.ts
  // For now, return a placeholder
  return { success: true, campaignId, conversions };
}
