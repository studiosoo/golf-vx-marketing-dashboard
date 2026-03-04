import mysql2 from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const conn = await mysql2.createConnection(process.env.DATABASE_URL);

  // 1. Add Chicago Golf Show to community_outreach (outbound event booth = sponsorship/partnership)
  const [existing] = await conn.query(
    'SELECT id FROM community_outreach WHERE org_name = ?',
    ['Chicago Golf Show 2026']
  );

  if (existing.length > 0) {
    console.log('Chicago Golf Show already in community_outreach, skipping...');
  } else {
    await conn.query(
      `INSERT INTO community_outreach (
        org_name, org_type, contact_name,
        request_type, request_date, event_name, event_date, event_location,
        estimated_attendees, request_description, status,
        decision_date, decision_notes,
        actual_donation_type, actual_cash_value, actual_perceived_value,
        benefits_received, estimated_reach, actual_leads_generated,
        roi_notes, is_recurring, priority, tags, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        'Chicago Golf Show 2026',
        'other',
        'Chicago Golf Show Organizers',
        'sponsorship',
        '2025-10-01',   // approximate request/planning date
        'Chicago Golf Show 2026',
        '2026-02-01',
        'Schaumburg Convention Center, Schaumburg, IL',
        2200,           // midpoint of 2,000–2,500
        'Annual Chicago Golf Show — Golf VX exhibitor booth with putting challenge. Outbound marketing event to drive brand awareness and trial bookings in the Chicago metro area.',
        'fulfilled',
        '2026-02-01',
        'Very successful. Putting challenge drove high engagement. ~50 free 1-hr promos distributed. Strong local audience quality.',
        'product_donation',  // actual_donation_type: free 1-hr promos + merch
        0,              // actual_cash_value: booth fee TBD
        2500,           // actual_perceived_value: ~50 × $25 promos + merch
        'Booth presence with tent (major visibility win), putting challenge (4/6/8/10-footer), ~50 free 1-hr promos, ~10 headcovers, ~10 towels, tees & golf balls. Recognition on event floor.',
        2200,           // estimated_reach = booth visitors
        0,              // actual_leads_generated: giveaway form submissions (TBD — form was too long)
        'High-quality local audience. One team signup. Multiple visitors expressed intent to visit soon. Key improvement for 2027: simplify giveaway form to name/email/phone only. Add backdrop, standardize putting contest with floor markings.',
        1,              // is_recurring: yes, annual event
        'high',
        JSON.stringify(['trade_show','annual','putting-challenge','local-audience','arlington-heights']),
        'Talk track: "Do you play simulator golf?" + "Are you near Arlington Heights?" — very effective. Shift rotation (20-min) worked well. Recommend venue staff presence next year for credibility.',
      ]
    );
    console.log('✓ Chicago Golf Show 2026 inserted into community_outreach');
  }

  // 2. Add to print_advertising as "event" type for visibility in the Print/Magazine tab
  const [existingPrint] = await conn.query(
    'SELECT id FROM print_advertising WHERE vendor_name = ?',
    ['Chicago Golf Show 2026 — Booth']
  );

  if (existingPrint.length > 0) {
    console.log('Chicago Golf Show already in print_advertising, skipping...');
  } else {
    await conn.query(
      `INSERT INTO print_advertising (
        vendor_name, publication_type, ad_size,
        cost_per_month, contract_months, total_contract_value,
        start_date, end_date, status,
        qr_destination, website,
        circulation, target_area, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        'Chicago Golf Show 2026 — Booth',
        'other',
        '10×10 Booth + Tent + Putting Challenge',
        0,
        1,
        0,              // booth fee not specified — update when known
        '2026-02-01',
        '2026-02-01',
        'completed',
        'https://ah.playgolfvx.com',
        'https://chicagogolfshow.com',
        2200,
        'Schaumburg, IL (Chicago Metro Area)',
        'Annual Chicago Golf Show. 2,000–2,500 booth visitors. Putting challenge: 4/6/8/10-footer with break. ~50 free 1-hr promos, ~10 headcovers, ~10 towels, tees & golf balls. Giveaway form needs simplification for 2027. Improvements: backdrop, floor markings, standardized prize signage, venue staff presence.',
      ]
    );
    console.log('✓ Chicago Golf Show 2026 inserted into print_advertising');
  }

  await conn.end();
  console.log('Done!');
}

main().catch(console.error);
