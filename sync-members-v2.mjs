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
  } catch {
    return null;
  }
}

function classifyTier(membership) {
  const m = membership.trim().toLowerCase();
  const skip = ['locker', 'need to cancel', 'need to change', 'employee', 'cancel?', 
                'requested to cancel', 'should have been canceled', 'duplicate', 'annual duplicate'];
  if (skip.some(kw => m.includes(kw))) return null;
  
  if (m === 'aa' || m === 'junior aa' || m.startsWith('sw') || 
      m.includes('family aa') || m.includes('famiy aa') || m.includes('annual family aa')) {
    return 'all_access_aces';
  }
  if (m === 'ss' || m.includes('family ss') || (m.startsWith('ss') && !m.includes('ssw'))) {
    return 'swing_savers';
  }
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
    const status = (cols[4] || 'active').trim();
    const created = (cols[5] || '').trim();
    const periodEnd = (cols[7] || '').trim();
    
    if (!name) continue;
    
    const amount = parseFloat(amountStr) || 0;
    const tier = classifyTier(membership);
    
    if (!tier) {
      skipped.push({ name, membership, amount });
      continue;
    }
    
    const isAnnual = membership.toLowerCase().includes('annual') || interval.toLowerCase() === 'year';
    const monthlyAmount = isAnnual ? amount / 12 : amount;
    
    members.push({
      name,
      membership,
      tier,
      paymentInterval: isAnnual ? 'annual' : 'monthly',
      amount,
      monthlyAmount,
      status: status.toLowerCase() === 'active' ? 'active' : 'inactive',
      joinDate: parseDate(created),
      renewalDate: parseDate(periodEnd),
    });
  }
  
  return { members, skipped };
}

async function syncMembers() {
  const db = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('Reading CSV...');
  const { members, skipped } = await readCSV();
  
  console.log(`Found ${members.length} active members to sync`);
  
  // Reset existing member statuses
  await db.execute(`UPDATE members SET status = 'inactive' WHERE membershipTier IN ('all_access_aces', 'swing_savers', 'golf_vx_pro')`);
  
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  
  for (const m of members) {
    try {
      const nameParts = m.name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim().split(/\s+/).filter(p => p.length > 1);
      const firstName = nameParts[0] || '';
      const lastName = nameParts[nameParts.length - 1] || '';
      
      const [existing] = await db.execute(
        `SELECT id FROM members WHERE LOWER(name) LIKE ? LIMIT 1`,
        [`%${firstName}%${lastName}%`]
      );
      
      const joinDate = m.joinDate || new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      if (existing.length > 0) {
        await db.execute(
          `UPDATE members SET 
            membershipTier = ?,
            status = 'active',
            renewalDate = ?,
            monthlyAmount = ?,
            paymentInterval = ?,
            boomerangMembership = ?,
            customerStatus = 'active',
            lifetimeValue = ?
          WHERE id = ?`,
          [m.tier, m.renewalDate, m.monthlyAmount, m.paymentInterval, m.membership, m.amount, existing[0].id]
        );
        updated++;
      } else {
        const email = `${firstName}.${lastName}.${Date.now()}@boomerang.golfvx.com`;
        await db.execute(
          `INSERT INTO members (name, email, membershipTier, status, joinDate, renewalDate, 
            monthlyAmount, paymentInterval, boomerangMembership, lifetimeValue, acquisitionSource, customerStatus)
          VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, 'boomerang', 'active')`,
          [m.name, email, m.tier, joinDate, m.renewalDate, m.monthlyAmount, m.paymentInterval, m.membership, m.amount]
        );
        inserted++;
      }
    } catch (err) {
      console.error(`  Error syncing ${m.name}: ${err.message}`);
      errors++;
    }
  }
  
  console.log(`\nSync complete: ${inserted} inserted, ${updated} updated, ${errors} errors`);
  
  // Final MRR calculation
  const [mrrStats] = await db.execute(`
    SELECT 
      membershipTier,
      COUNT(*) as count,
      SUM(monthlyAmount) as totalMRR,
      COUNT(CASE WHEN paymentInterval = 'annual' THEN 1 END) as annualCount,
      COUNT(CASE WHEN paymentInterval = 'monthly' THEN 1 END) as monthlyCount
    FROM members 
    WHERE status = 'active' AND membershipTier IN ('all_access_aces', 'swing_savers', 'golf_vx_pro')
    GROUP BY membershipTier
  `);
  
  console.log('\n=== FINAL MRR BY TIER ===');
  let totalMRR = 0;
  for (const row of mrrStats) {
    const mrr = parseFloat(row.totalMRR || 0);
    totalMRR += mrr;
    console.log(`  ${row.membershipTier}: ${row.count} members | MRR: $${mrr.toFixed(2)} (${row.monthlyCount} monthly, ${row.annualCount} annual)`);
  }
  console.log(`  TOTAL MRR: $${totalMRR.toFixed(2)}`);
  
  await db.end();
}

syncMembers().catch(console.error);
