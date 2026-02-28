import mysql from 'mysql2/promise';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const CSV_PATH = '/home/ubuntu/upload/ArlingtonHeights_ActiveMembers(Venuecopy).csv';

function parseDate(dateStr) {
  if (!dateStr || !dateStr.trim()) return null;
  try {
    const d = new Date(dateStr.trim());
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 19).replace('T', ' ');
  } catch { return null; }
}

function classifyTier(membership) {
  const m = membership.trim().toLowerCase();
  const skip = ['locker', 'need to cancel', 'need to change', 'employee', 'cancel?', 
                'requested to cancel', 'should have been canceled', 'duplicate', 'annual duplicate'];
  if (skip.some(kw => m.includes(kw))) return null;
  
  // All-Access Aces: AA, SW (Swing Wide), Junior AA, Family AA, Annual AA, Annual Family AA
  if (m === 'aa' || m === 'junior aa' || m.startsWith('sw') || 
      m.includes('family aa') || m.includes('famiy aa') || m.includes('annual aa')) {
    return 'all_access_aces';
  }
  // Swing Savers: SS, Annual SS, Family SS
  if (m === 'ss' || m.includes('annual ss') || m.includes('family ss')) {
    return 'swing_savers';
  }
  // Pro Membership
  if (m === 'pm') return 'golf_vx_pro';
  return null;
}

async function readCSV() {
  const members = [];
  const skipped = [];
  const rl = createInterface({ input: createReadStream(CSV_PATH), crlfDelay: Infinity });
  let isHeader = true;
  let stopParsing = false;
  
  for await (const line of rl) {
    if (isHeader) { isHeader = false; continue; }
    if (!line.trim() || line.startsWith(',,,')) continue;
    if (line.toLowerCase().includes('lockers in venue')) { stopParsing = true; }
    if (stopParsing) continue;
    
    const cols = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { cols.push(current); current = ''; }
      else { current += ch; }
    }
    cols.push(current);
    
    const name = (cols[0] || '').trim().replace(/,$/, '');
    const membership = (cols[1] || '').trim();
    const interval = (cols[2] || '').trim();
    const amountStr = (cols[3] || '').trim();
    const created = (cols[5] || '').trim();
    const periodEnd = (cols[7] || '').trim();
    
    if (!name) continue;
    
    const amount = parseFloat(amountStr) || 0;
    const tier = classifyTier(membership);
    if (!tier) { skipped.push({ name, membership }); continue; }
    
    const isAnnual = membership.toLowerCase().includes('annual') || interval.toLowerCase() === 'year';
    const monthlyAmount = isAnnual ? amount / 12 : amount;
    
    members.push({ name, membership, tier, paymentInterval: isAnnual ? 'annual' : 'monthly', amount, monthlyAmount, joinDate: parseDate(created), renewalDate: parseDate(periodEnd) });
  }
  return { members, skipped };
}

async function syncMembers() {
  const db = await mysql.createConnection(process.env.DATABASE_URL);
  const { members, skipped } = await readCSV();
  
  console.log(`CSV: ${members.length} members, ${skipped.length} skipped`);
  
  // Reset existing member statuses
  await db.execute(`UPDATE members SET status = 'inactive' WHERE membershipTier IN ('all_access_aces', 'swing_savers', 'golf_vx_pro')`);
  
  let inserted = 0, updated = 0, errors = 0;
  
  for (const m of members) {
    try {
      // Clean name for matching: remove parenthetical notes
      const cleanName = m.name.replace(/\s*\(.*?\)\s*/g, '').trim();
      const parts = cleanName.toLowerCase().split(/\s+/).filter(p => p.length > 1);
      const firstName = parts[0] || '';
      const lastName = parts[parts.length - 1] || '';
      
      // Try multiple match strategies
      let existing = [];
      
      // Strategy 1: exact name match (cleaned)
      const [exact] = await db.execute(`SELECT id FROM members WHERE LOWER(TRIM(name)) = ? LIMIT 1`, [cleanName.toLowerCase()]);
      if (exact.length > 0) existing = exact;
      
      // Strategy 2: first + last name contains
      if (!existing.length && firstName && lastName && firstName !== lastName) {
        const [fuzzy] = await db.execute(
          `SELECT id FROM members WHERE LOWER(name) LIKE ? AND LOWER(name) LIKE ? LIMIT 1`,
          [`%${firstName}%`, `%${lastName}%`]
        );
        if (fuzzy.length > 0) existing = fuzzy;
      }
      
      // Strategy 3: just last name (for unique last names)
      if (!existing.length && lastName.length > 3) {
        const [byLast] = await db.execute(
          `SELECT id FROM members WHERE LOWER(name) LIKE ? LIMIT 1`,
          [`%${lastName}%`]
        );
        if (byLast.length > 0) existing = byLast;
      }
      
      const joinDate = m.joinDate || new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      if (existing.length > 0) {
        await db.execute(
          `UPDATE members SET membershipTier = ?, status = 'active', renewalDate = ?,
            monthlyAmount = ?, paymentInterval = ?, boomerangMembership = ?,
            customerStatus = 'active', lifetimeValue = ?
          WHERE id = ?`,
          [m.tier, m.renewalDate, m.monthlyAmount, m.paymentInterval, m.membership, m.amount, existing[0].id]
        );
        updated++;
      } else {
        // Insert new member
        const ts = Date.now();
        const email = `${firstName}.${lastName}.${ts}@boomerang.golfvx.com`;
        await db.execute(
          `INSERT INTO members (name, email, membershipTier, status, joinDate, renewalDate,
            monthlyAmount, paymentInterval, boomerangMembership, lifetimeValue, acquisitionSource, customerStatus)
          VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, 'boomerang', 'active')`,
          [m.name, email, m.tier, joinDate, m.renewalDate, m.monthlyAmount, m.paymentInterval, m.membership, m.amount]
        );
        inserted++;
        console.log(`  Inserted: ${m.name} (${m.tier})`);
      }
    } catch (err) {
      console.error(`  Error ${m.name}: ${err.message}`);
      errors++;
    }
  }
  
  console.log(`\nSync: ${inserted} inserted, ${updated} updated, ${errors} errors`);
  
  // Final counts
  const [counts] = await db.execute(`
    SELECT membershipTier, COUNT(*) as count, SUM(monthlyAmount) as mrr,
      SUM(CASE WHEN paymentInterval = 'annual' THEN 1 ELSE 0 END) as annual,
      SUM(CASE WHEN paymentInterval = 'monthly' THEN 1 ELSE 0 END) as monthly
    FROM members WHERE status = 'active' AND membershipTier IN ('all_access_aces', 'swing_savers', 'golf_vx_pro')
    GROUP BY membershipTier
  `);
  
  let totalMRR = 0;
  let totalMembers = 0;
  console.log('\n=== FINAL COUNTS ===');
  for (const r of counts) {
    const mrr = parseFloat(r.mrr || 0);
    totalMRR += mrr;
    totalMembers += r.count;
    console.log(`  ${r.membershipTier}: ${r.count} (${r.monthly} monthly, ${r.annual} annual) | MRR: $${mrr.toFixed(2)}`);
  }
  console.log(`  TOTAL: ${totalMembers} members | MRR: $${totalMRR.toFixed(2)}/mo`);
  
  await db.end();
}

syncMembers().catch(console.error);
