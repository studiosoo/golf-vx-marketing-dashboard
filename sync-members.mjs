import mysql from 'mysql2/promise';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const CSV_PATH = '/home/ubuntu/upload/ArlingtonHeights_ActiveMembers(Venuecopy).csv';

// Parse date string like "1/21/2026 22:12" to MySQL timestamp
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

// Classify membership tier
function classifyTier(membership) {
  const m = membership.trim().toLowerCase();
  
  // Skip non-paying members
  const skipKeywords = ['locker', 'need to cancel', 'need to change', 'employee', 'cancel?', 
                        'requested to cancel', 'should have been canceled', 'duplicate',
                        'annual duplicate', 'need to cancel'];
  for (const kw of skipKeywords) {
    if (m.includes(kw)) return null;
  }
  
  // All-Access Aces (AA, SW = Swing Wide, Junior AA, Family AA)
  if (m === 'aa' || m === 'annual aa' || m === 'junior aa' || 
      m.startsWith('aa ') || m.startsWith('annual aa') || m.startsWith('sw') ||
      m.includes('family aa') || m.includes('famiy aa') || m.includes('annual family aa')) {
    return 'all_access_aces';
  }
  
  // Swing Savers (SS, Annual SS, Family SS)
  if (m === 'ss' || m === 'annual ss' || m.startsWith('ss ') || m.startsWith('annual ss') ||
      m.includes('family ss')) {
    return 'swing_savers';
  }
  
  // Pro Membership
  if (m === 'pm') {
    return 'golf_vx_pro';
  }
  
  return null;
}

// Parse payment interval
function parseInterval(membership, interval) {
  const m = membership.toLowerCase();
  if (m.includes('annual') || interval.toLowerCase() === 'year') return 'annual';
  return 'monthly';
}

// Read CSV
async function readCSV() {
  const members = [];
  const skipped = [];
  
  const rl = createInterface({
    input: createReadStream(CSV_PATH),
    crlfDelay: Infinity,
  });
  
  let isHeader = true;
  let stopParsing = false;
  
  for await (const line of rl) {
    if (isHeader) { isHeader = false; continue; }
    if (!line.trim() || line.startsWith(',,,')) continue;
    if (line.toLowerCase().includes('lockers in venue')) { stopParsing = true; }
    if (stopParsing) continue;
    
    // Parse CSV line (handle commas in quoted fields)
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
    const periodStart = (cols[6] || '').trim();
    const periodEnd = (cols[7] || '').trim();
    
    if (!name) continue;
    
    const amount = parseFloat(amountStr) || 0;
    const tier = classifyTier(membership);
    
    if (!tier) {
      skipped.push({ name, membership, amount });
      continue;
    }
    
    members.push({
      name,
      membership,
      tier,
      paymentInterval: parseInterval(membership, interval),
      amount,
      status: status.toLowerCase() === 'active' ? 'active' : 'inactive',
      joinDate: parseDate(created),
      renewalDate: parseDate(periodEnd),
      currentPeriodStart: parseDate(periodStart),
    });
  }
  
  return { members, skipped };
}

// Main sync function
async function syncMembers() {
  const db = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('Reading CSV...');
  const { members, skipped } = await readCSV();
  
  console.log(`\nFound ${members.length} active members to sync`);
  console.log(`Skipped ${skipped.length} non-member entries`);
  
  // Count by tier
  const tierCounts = {};
  for (const m of members) {
    tierCounts[m.tier] = (tierCounts[m.tier] || 0) + 1;
  }
  console.log('\nTier breakdown:');
  for (const [tier, count] of Object.entries(tierCounts)) {
    console.log(`  ${tier}: ${count}`);
  }
  
  // First, mark all existing members as inactive (we'll re-activate from CSV)
  console.log('\nResetting existing member statuses...');
  await db.execute(
    `UPDATE members SET status = 'inactive' WHERE membershipTier IN ('all_access_aces', 'swing_savers', 'golf_vx_pro')`
  );
  
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  
  for (const m of members) {
    try {
      // Check if member exists by name (fuzzy match)
      const nameParts = m.name.toLowerCase().split(/\s+/).filter(p => p.length > 2);
      const firstName = nameParts[0] || '';
      const lastName = nameParts[nameParts.length - 1] || '';
      
      const [existing] = await db.execute(
        `SELECT id, email FROM members WHERE LOWER(name) LIKE ? OR LOWER(name) LIKE ? LIMIT 1`,
        [`%${firstName}%${lastName}%`, `%${lastName}%${firstName}%`]
      );
      
      const renewalDate = m.renewalDate || null;
      const joinDate = m.joinDate || new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      if (existing.length > 0) {
        // Update existing member
        await db.execute(
          `UPDATE members SET 
            membershipTier = ?,
            status = 'active',
            renewalDate = ?,
            lifetimeValue = GREATEST(lifetimeValue, ?),
            notes = CONCAT(IFNULL(notes, ''), ' | Boomerang: ', ?)
          WHERE id = ?`,
          [m.tier, renewalDate, m.amount, m.membership, existing[0].id]
        );
        updated++;
      } else {
        // Insert new member
        const email = `${firstName}.${lastName}@boomerang-import.golfvx.com`;
        await db.execute(
          `INSERT INTO members (name, email, membershipTier, status, joinDate, renewalDate, 
            lifetimeValue, acquisitionSource, notes, customerStatus)
          VALUES (?, ?, ?, 'active', ?, ?, ?, 'boomerang', ?, 'active')`,
          [m.name, email, m.tier, joinDate, renewalDate, m.amount, `Boomerang: ${m.membership}`]
        );
        inserted++;
      }
    } catch (err) {
      console.error(`  Error syncing ${m.name}: ${err.message}`);
      errors++;
    }
  }
  
  console.log(`\nSync complete: ${inserted} inserted, ${updated} updated, ${errors} errors`);
  
  // Final count
  const [counts] = await db.execute(
    `SELECT membershipTier, COUNT(*) as count FROM members WHERE status = 'active' GROUP BY membershipTier`
  );
  console.log('\nFinal active member counts in DB:');
  for (const row of counts) {
    console.log(`  ${row.membershipTier}: ${row.count}`);
  }
  
  await db.end();
}

syncMembers().catch(console.error);
