/**
 * Seed the 8 marketing programs for Golf VX Arlington Heights
 * Based on data from conversion tracking, autonomous sync, Acuity mappings, and campaign master docs
 */
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  // Check if campaigns already exist
  const [existing] = await connection.execute("SELECT COUNT(*) as cnt FROM campaigns");
  if (existing[0].cnt > 0) {
    console.log(`Already have ${existing[0].cnt} campaigns. Skipping seed.`);
    await connection.end();
    return;
  }

  const now = new Date();
  const programs = [
    {
      name: "PBGA Junior Summer Camp",
      category: "trial_conversion",
      type: "pbga_programs",
      status: "active",
      description: "Summer golf camp program for juniors aged 7-17. Weekly sessions with PGA coaching, swing analysis, and on-course play.",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-08-31"),
      budget: "100.00",
      actualSpend: "0.00",
      actualRevenue: "0.00",
      targetApplications: 50,
      actualApplications: 0,
      targetConversions: 12,
      actualConversions: 0,
      goalType: "attendance",
      goalTarget: "12.00",
      goalActual: "0.00",
      goalUnit: "students",
      primaryKpi: "Cost per student",
      kpiTarget: "8.3300",
      kpiActual: "0.0000",
      kpiUnit: "USD",
    },
    {
      name: "Sunday Clinic",
      category: "trial_conversion",
      type: "trial_conversion",
      status: "active",
      description: "Weekly PGA coaching clinic every Sunday. Open to all skill levels. $20 per session (normally $200).",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      budget: "500.00",
      actualSpend: "120.00",
      actualRevenue: "2400.00",
      targetApplications: 200,
      actualApplications: 48,
      targetConversions: 100,
      actualConversions: 48,
      goalType: "attendance",
      goalTarget: "200.00",
      goalActual: "48.00",
      goalUnit: "attendees",
      primaryKpi: "Attendance rate",
      kpiTarget: "80.0000",
      kpiActual: "24.0000",
      kpiUnit: "%",
    },
    {
      name: "PBGA Winter Clinic",
      category: "trial_conversion",
      type: "pbga_programs",
      status: "active",
      description: "Winter indoor golf clinic series. 4-week program with PGA instruction, video analysis, and practice drills.",
      startDate: new Date("2026-01-06"),
      endDate: new Date("2026-03-31"),
      budget: "300.00",
      actualSpend: "266.00",
      actualRevenue: "5400.00",
      targetApplications: 40,
      actualApplications: 18,
      targetConversions: 30,
      actualConversions: 18,
      goalType: "revenue",
      goalTarget: "6000.00",
      goalActual: "5400.00",
      goalUnit: "USD",
      primaryKpi: "ROAS",
      kpiTarget: "3.5000",
      kpiActual: "20.3000",
      kpiUnit: "ratio",
    },
    {
      name: "$25 1-Hour Trial Session",
      category: "trial_conversion",
      type: "trial_conversion",
      status: "active",
      description: "Introductory trial session for new customers. 1 hour on any simulator with full access to 200+ courses.",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      budget: "200.00",
      actualSpend: "55.20",
      actualRevenue: "1125.00",
      targetApplications: 100,
      actualApplications: 45,
      targetConversions: 50,
      actualConversions: 45,
      goalType: "leads",
      goalTarget: "100.00",
      goalActual: "45.00",
      goalUnit: "trials",
      primaryKpi: "Conversion rate",
      kpiTarget: "20.0000",
      kpiActual: "45.0000",
      kpiUnit: "%",
    },
    {
      name: "Annual Membership Giveaway",
      category: "membership_acquisition",
      type: "membership_acquisition",
      status: "active",
      description: "1st Anniversary $7,500 giveaway campaign. Collect applications, convert to memberships. Feb 16 - Mar 31, 2026.",
      startDate: new Date("2026-02-16"),
      endDate: new Date("2026-04-30"),
      budget: "3000.00",
      actualSpend: "0.00",
      actualRevenue: "0.00",
      targetApplications: 500,
      actualApplications: 0,
      targetConversions: 40,
      actualConversions: 0,
      landingPageUrl: "https://ah.playgolfvx.com/anniversary",
      goalType: "leads",
      goalTarget: "500.00",
      goalActual: "0.00",
      goalUnit: "applications",
      primaryKpi: "Cost per application",
      kpiTarget: "6.0000",
      kpiActual: "0.0000",
      kpiUnit: "USD",
    },
    {
      name: "Drive Day Competition",
      category: "member_retention",
      type: "member_retention",
      status: "active",
      description: "Monthly longest drive competition. Open to all skill levels. Free with bay rental. Public leaderboard.",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      budget: "100.00",
      actualSpend: "0.00",
      actualRevenue: "0.00",
      targetApplications: 50,
      actualApplications: 0,
      targetConversions: 30,
      actualConversions: 0,
      landingPageUrl: "https://ah.playgolfvx.com/drive-day-public",
      goalType: "attendance",
      goalTarget: "50.00",
      goalActual: "0.00",
      goalUnit: "participants",
      primaryKpi: "Participation rate",
      kpiTarget: "60.0000",
      kpiActual: "0.0000",
      kpiUnit: "%",
    },
    {
      name: "Instagram Follower Growth",
      category: "membership_acquisition",
      type: "event_specific",
      status: "active",
      description: "Organic and paid Instagram growth campaign. Target 500-800 new followers through content and ads.",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-06-30"),
      budget: "200.00",
      actualSpend: "0.00",
      actualRevenue: "0.00",
      targetApplications: 800,
      actualApplications: 0,
      targetConversions: 500,
      actualConversions: 0,
      goalType: "followers",
      goalTarget: "800.00",
      goalActual: "0.00",
      goalUnit: "followers",
      primaryKpi: "Cost per follower",
      kpiTarget: "0.2500",
      kpiActual: "0.0000",
      kpiUnit: "USD",
    },
    {
      name: "Corporate Events B2B",
      category: "corporate_events",
      type: "corporate_events",
      status: "active",
      description: "Corporate team building events, holiday parties, and B2B sales outreach. Target local businesses.",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      budget: "500.00",
      actualSpend: "0.00",
      actualRevenue: "115.08",
      targetApplications: 20,
      actualApplications: 0,
      targetConversions: 10,
      actualConversions: 0,
      goalType: "revenue",
      goalTarget: "5000.00",
      goalActual: "115.08",
      goalUnit: "USD",
      primaryKpi: "Revenue per event",
      kpiTarget: "500.0000",
      kpiActual: "0.0000",
      kpiUnit: "USD",
    },
  ];

  for (const p of programs) {
    const cols = Object.keys(p);
    const placeholders = cols.map(() => "?").join(", ");
    const values = cols.map(k => {
      const v = p[k];
      if (v instanceof Date) return v;
      return v;
    });
    
    await connection.execute(
      `INSERT INTO campaigns (${cols.join(", ")}) VALUES (${placeholders})`,
      values
    );
    console.log(`Seeded: ${p.name}`);
  }

  // Now seed the program_campaigns junction table for multi-campaign associations
  const [allPrograms] = await connection.execute("SELECT id, name, category FROM campaigns");
  
  const programCampaignMappings = {
    "PBGA Junior Summer Camp": ["trial_conversion"],
    "Sunday Clinic": ["trial_conversion", "member_retention"],
    "PBGA Winter Clinic": ["trial_conversion"],
    "$25 1-Hour Trial Session": ["trial_conversion", "membership_acquisition"],
    "Annual Membership Giveaway": ["membership_acquisition"],
    "Drive Day Competition": ["member_retention"],
    "Instagram Follower Growth": ["membership_acquisition"],
    "Corporate Events B2B": ["corporate_events"],
  };

  for (const program of allPrograms) {
    const mappings = programCampaignMappings[program.name] || [program.category];
    for (const sc of mappings) {
      await connection.execute(
        "INSERT INTO program_campaigns (programId, strategicCampaign) VALUES (?, ?)",
        [program.id, sc]
      );
      console.log(`  Mapped ${program.name} -> ${sc}`);
    }
  }

  console.log(`\nSeeded ${programs.length} programs with campaign mappings.`);
  await connection.end();
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
