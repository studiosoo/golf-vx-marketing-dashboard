const mysql = require('mysql2/promise');

async function run() {
  const url = process.env.DATABASE_URL;
  const conn = await mysql.createConnection(url);

  try {
  // goalType for Trial Session stays as 'leads' - we added 'leads' template to goalTemplates.ts
  console.log('Trial Session goalType stays as leads (template now exists in goalTemplates.ts)');

    // Check if display_order column exists
    const [cols] = await conn.execute('DESCRIBE campaigns');
    const hasDisplayOrder = cols.some(c => c.Field === 'display_order');
    console.log('Has display_order column:', hasDisplayOrder);

    // Add display_order column if needed
    if (!hasDisplayOrder) {
      await conn.execute('ALTER TABLE campaigns ADD COLUMN display_order INT DEFAULT 999');
      console.log('Added display_order column');
    }

    // Set order: Annual Giveaway=1, Winter Clinic=2, Trial Session=3, Sunday Clinic=4, PBGA Junior=5, rest=10+
    await conn.execute('UPDATE campaigns SET display_order = 1 WHERE id = 5'); // Annual Membership Giveaway
    await conn.execute('UPDATE campaigns SET display_order = 2 WHERE id = 3'); // PBGA Winter Clinic
    await conn.execute('UPDATE campaigns SET display_order = 3 WHERE id = 4'); // 1-Hour Trial Session
    await conn.execute('UPDATE campaigns SET display_order = 4 WHERE id = 2'); // Sunday Clinic
    await conn.execute('UPDATE campaigns SET display_order = 5 WHERE id = 1'); // PBGA Junior Summer Camp
    await conn.execute('UPDATE campaigns SET display_order = 6 WHERE id = 7'); // Instagram Follower Growth
    await conn.execute('UPDATE campaigns SET display_order = 7 WHERE id = 30001'); // Superbowl Watch Party
    console.log('Set display_order for all campaigns');

    const [all] = await conn.execute('SELECT id, name, goalType, display_order FROM campaigns ORDER BY display_order, id');
    console.log('Updated order:');
    all.forEach(r => console.log('  ' + r.display_order + ': ' + r.name + ' (goalType: ' + r.goalType + ')'));

    // Also seed Chicago Golf Show into print_advertising
    const [existing] = await conn.execute('SELECT id FROM print_advertising WHERE vendor_name = ?', ['Chicago Golf Show 2026']);
    if (existing.length === 0) {
      await conn.execute(`
        INSERT INTO print_advertising 
        (vendor_name, publication_type, ad_size, cost_per_month, contract_months, total_contract_value, 
         start_date, end_date, status, qr_destination, instagram_handle, website, 
         circulation, target_area, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        'Chicago Golf Show 2026',
        'other',
        'Booth (10x10)',
        0,
        1,
        0,
        '2026-02-06',
        '2026-02-08',
        'completed',
        'ah.playgolfvx.com',
        '@golfvxarlingtonheights',
        'playgolfvx.com',
        2500,
        'Chicago, IL - Suburban golfers',
        'Chicago Golf Show at Donald E. Stephens Convention Center, Rosemont IL. Feb 6-8, 2026. Booth with putting challenge. ~2,500 booth visitors, 50%+ putting challenge participation, ~50 free 1-hour promo sessions given out, 1 team signup. Anniversary Giveaway form too long - drove people away. Key lesson: simplify forms at events. Estimated reach: 2,500 targeted golfers in Chicago suburbs.'
      ]);
      console.log('Seeded Chicago Golf Show 2026 into print_advertising');
    } else {
      console.log('Chicago Golf Show already exists, skipping');
    }

  } finally {
    await conn.end();
  }
}

run().catch(console.error);
