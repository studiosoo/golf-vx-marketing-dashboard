/**
 * Seed script for influencer_partnerships and community_outreach tables
 * Based on real data from Golf VX Arlington Heights screenshots
 */
import { createConnection } from 'mysql2/promise';

const conn = await createConnection(process.env.DATABASE_URL);

// ─── Influencer Partnerships ───────────────────────────────────────────────
console.log('Seeding influencer_partnerships...');

// Check if @actionheightslifestyle already exists
const [existing] = await conn.query(
  "SELECT id FROM influencer_partnerships WHERE handle = '@actionheightslifestyle' LIMIT 1"
);

if (existing.length === 0) {
  await conn.query(`
    INSERT INTO influencer_partnerships (
      handle, platform, follower_count, contact_name,
      deal_date, total_cost, deliverables, campaign_goal, target_audience,
      status, actual_reach, actual_impressions, actual_engagements,
      content_urls, notes, created_at, updated_at
    ) VALUES (
      '@actionheightslifestyle', 'instagram', NULL, NULL,
      '2025-02-01', 500.00,
      '1 Instagram Reel + 3 Instagram Stories featuring Golf VX Arlington Heights',
      'Brand awareness and local audience reach in Arlington Heights area',
      'Arlington Heights locals, active lifestyle enthusiasts, families',
      'completed', NULL, NULL, NULL,
      '["https://www.instagram.com/actionheightslifestyle/"]',
      'Paid $500 for 1 reel and 3 stories. Local lifestyle influencer based in Arlington Heights.',
      NOW(), NOW()
    )
  `);
  console.log('  ✓ Added @actionheightslifestyle');
} else {
  console.log('  ⟳ @actionheightslifestyle already exists, skipping');
}

// ─── Community Outreach ────────────────────────────────────────────────────
console.log('Seeding community_outreach...');

const outreachRecords = [
  {
    org_name: 'Windsor Elementary School PTA',
    org_type: 'school_pta',
    contact_name: 'Amy Elston',
    contact_email: 'windsortrivianight@gmail.com',
    contact_phone: '269-910-8345',
    website: 'https://www.windsorpta.org/',
    ein: '36-3291003',
    is_501c3: 1,
    request_type: 'gift_card',
    request_date: '2026-01-26',
    event_name: 'Windsor PTA Trivia Night Fundraiser',
    event_date: '2026-02-27',
    event_location: "Knights of Columbus Hall, 15 N Hickory Ave, Arlington Heights, IL 60004",
    estimated_attendees: 200,
    requested_amount: null,
    request_description: 'Request for donation of items, services, or gift certificates for Trivia Night raffle and prizes. 501(c)(3) nonprofit. Donors receive recognition on Windsor PTA Facebook and Instagram pages, and display of business name and logo at event.',
    status: 'fulfilled',
    decision_date: '2026-02-04',
    decision_notes: 'Approved by Jun Bae. Donated 2x $50 Golf VX gift cards + 1 FREE Full-Day Summer Camp Week ($699 value) as grand raffle prize. Also included promotional flyers and QR codes.',
    actual_donation_type: '2x $50 Golf VX Gift Cards + 1 Free Summer Camp Week (grand prize)',
    actual_cash_value: 100.00,
    actual_perceived_value: 799.00,
    benefits_received: 'Business name/logo displayed at event, recognition on Windsor PTA social media, promotional flyers with QR codes distributed to ~200 attendees, opportunity to promote Winter Clinics and Junior Summer Camp',
    estimated_reach: 200,
    is_recurring: 1,
    priority: 'high',
    notes: 'Strong local school community partnership. Event at Knights of Columbus Hall. Jun Bae coordinated with Gina Choi and Brian Jung. Consider recurring annual donation.',
  },
  {
    org_name: 'Skokie Firefighters Benevolent Fund',
    org_type: 'nonprofit',
    contact_name: 'Joseph Biasi',
    contact_email: 'jbiasi87@gmail.com',
    contact_phone: '847-666-7966',
    website: null,
    ein: null,
    is_501c3: 1,
    request_type: 'cash_donation',
    request_date: '2026-01-06',
    event_name: 'Skokie Firefighters Benevolent Fund Bowling Outing',
    event_date: '2026-02-01',
    event_location: 'Skokie, IL',
    estimated_attendees: null,
    requested_amount: null,
    request_description: 'Non-for-profit charity event for the Skokie Firefighters Benevolent Fund bowling outing. Fund aids firefighters who fall upon hardships while serving their community. Project Fire Buddies helps kids with terminal illnesses. 501C can be provided.',
    status: 'received',
    decision_date: null,
    decision_notes: null,
    actual_donation_type: null,
    actual_cash_value: 0.00,
    actual_perceived_value: 0.00,
    benefits_received: null,
    estimated_reach: null,
    is_recurring: 0,
    priority: 'low',
    notes: 'Received Jan 6, 2026. Joseph Biasi FF/PM, Skokie Fire Department Benevolent Fund Committee. No decision made yet. Event already passed (Feb 1).',
  },
  {
    org_name: 'Illinois Sluggers Athletic Association',
    org_type: 'school_sports',
    contact_name: 'Lisa Long',
    contact_email: 'ldemichele@yahoo.com',
    contact_phone: null,
    website: null,
    ein: null,
    is_501c3: 1,
    request_type: 'product_donation',
    request_date: '2026-02-12',
    event_name: "Sluggers' Banquet",
    event_date: '2026-02-27',
    event_location: 'Schaumburg, IL',
    estimated_attendees: 250,
    requested_amount: null,
    request_description: 'Youth softball organization 501-C, Schaumburg IL. 6 teams ages 8-18. Annual Sluggers Banquet where they raffle off prizes. Requesting donation of basket or gift card. ~250 attendees will see product and have opportunity to win it.',
    status: 'received',
    decision_date: null,
    decision_notes: null,
    actual_donation_type: null,
    actual_cash_value: 0.00,
    actual_perceived_value: 0.00,
    benefits_received: null,
    estimated_reach: 250,
    is_recurring: 0,
    priority: 'medium',
    notes: 'Received Feb 12, 2026. Event Feb 27. 250 attendees. Schaumburg-based, slightly outside primary market area. Lisa Long contact.',
  },
  {
    org_name: 'Lake County Symphony Orchestra',
    org_type: 'arts_culture',
    contact_name: 'Noah Mendez',
    contact_email: 'nmendez@lakecountysymphonyorchestra.com',
    contact_phone: '224.602.1611',
    website: 'https://lakecountysymphonyorchestra.com',
    ein: null,
    is_501c3: 0,
    request_type: 'partnership',
    request_date: '2026-01-30',
    event_name: 'Golf VX x Lake County Symphony Partnership',
    event_date: null,
    event_location: null,
    estimated_attendees: null,
    requested_amount: null,
    request_description: 'Partnership/sponsorship discussion initiated by Jun Bae. Noah Mendez (Board of Directors - President) expressed interest in reconnecting when something aligns naturally. Planning another fundraising event in next few weeks.',
    status: 'follow_up',
    decision_date: null,
    decision_notes: 'Jun Bae reached out proactively. Noah Mendez responded positively, mentioned upcoming fundraising event. Follow up when their event solidifies.',
    actual_donation_type: null,
    actual_cash_value: 0.00,
    actual_perceived_value: 0.00,
    benefits_received: null,
    estimated_reach: null,
    is_recurring: 0,
    priority: 'medium',
    notes: 'Proactive outreach by Golf VX. Noah Mendez is Board President. Powered by Monday CRM. Good arts/culture partnership opportunity for brand positioning.',
  },
];

for (const record of outreachRecords) {
  const [check] = await conn.query(
    'SELECT id FROM community_outreach WHERE org_name = ? AND event_name = ? LIMIT 1',
    [record.org_name, record.event_name]
  );
  if (check.length > 0) {
    console.log(`  ⟳ ${record.org_name} already exists, skipping`);
    continue;
  }
  await conn.query(
    `INSERT INTO community_outreach (
      org_name, org_type, contact_name, contact_email, contact_phone,
      website, ein, is_501c3, request_type, request_date,
      event_name, event_date, event_location, estimated_attendees,
      requested_amount, request_description, status, decision_date,
      decision_notes, actual_donation_type, actual_cash_value,
      actual_perceived_value, benefits_received, estimated_reach,
      is_recurring, priority, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      record.org_name, record.org_type, record.contact_name, record.contact_email, record.contact_phone,
      record.website, record.ein, record.is_501c3, record.request_type, record.request_date,
      record.event_name, record.event_date, record.event_location, record.estimated_attendees,
      record.requested_amount, record.request_description, record.status, record.decision_date,
      record.decision_notes, record.actual_donation_type, record.actual_cash_value,
      record.actual_perceived_value, record.benefits_received, record.estimated_reach,
      record.is_recurring, record.priority, record.notes,
    ]
  );
  console.log(`  ✓ Added ${record.org_name}`);
}

await conn.end();
console.log('\nSeed complete!');
