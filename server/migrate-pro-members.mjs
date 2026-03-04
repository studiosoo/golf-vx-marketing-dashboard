/**
 * Migration script: Add boomerangEmail column and merge duplicate pro members
 * Run with: node server/migrate-pro-members.mjs
 */
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

console.log('=== Step 1: Add boomerangEmail column if not exists ===');
try {
  await conn.execute(`
    ALTER TABLE members 
    ADD COLUMN IF NOT EXISTS boomerangEmail varchar(320) NULL 
    COMMENT 'Boomerang-issued email (*.membership@boomerang-import.golfvx.com)'
  `);
  console.log('✓ boomerangEmail column added (or already exists)');
} catch (e) {
  // MySQL < 8.0 doesn't support IF NOT EXISTS for ADD COLUMN
  if (e.code === 'ER_DUP_FIELDNAME') {
    console.log('✓ boomerangEmail column already exists');
  } else {
    // Try without IF NOT EXISTS
    try {
      await conn.execute(`
        ALTER TABLE members 
        ADD COLUMN boomerangEmail varchar(320) NULL 
        COMMENT 'Boomerang-issued email (*.membership@boomerang-import.golfvx.com)'
      `);
      console.log('✓ boomerangEmail column added');
    } catch (e2) {
      if (e2.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ boomerangEmail column already exists');
      } else {
        console.error('Failed to add column:', e2.message);
      }
    }
  }
}

console.log('\n=== Step 2: Find all pro members ===');
const [allProMembers] = await conn.execute(`
  SELECT id, name, email, status, monthlyAmount, joinDate, notes, boomerangEmail
  FROM members 
  WHERE membershipTier = 'golf_vx_pro'
  ORDER BY name, joinDate DESC
`);
console.log(`Found ${allProMembers.length} pro member records:`);
allProMembers.forEach(m => console.log(`  [${m.id}] ${m.name} | ${m.email} | ${m.status} | $${m.monthlyAmount}/mo`));

console.log('\n=== Step 3: Identify duplicates by normalized name ===');
// Group by normalized name (lowercase, trim)
const byName = {};
for (const m of allProMembers) {
  // Strip "(pro membership)" / "(promembership)" suffixes from Boomerang imports
  const normalizedName = m.name
    .replace(/\s*\(pro\s*membership\)/gi, '')
    .replace(/\s*\(promembership\)/gi, '')
    .trim()
    .toLowerCase();
  if (!byName[normalizedName]) byName[normalizedName] = [];
  byName[normalizedName].push(m);
}

const duplicates = Object.entries(byName).filter(([, members]) => members.length > 1);
console.log(`Found ${duplicates.length} duplicate groups:`);
duplicates.forEach(([name, members]) => {
  console.log(`  "${name}": ${members.map(m => `[${m.id}] ${m.email}`).join(' | ')}`);
});

if (duplicates.length === 0) {
  console.log('No duplicates to merge.');
  await conn.end();
  process.exit(0);
}

console.log('\n=== Step 4: Merge duplicates ===');
for (const [normalizedName, members] of duplicates) {
  // Identify which is the "real" record (personal email = active, higher monthlyAmount, or non-boomerang email)
  const isBoomerangEmail = (email) => email.includes('@boomerang-import.golfvx.com');
  
  // Sort: real member first (non-boomerang, active, higher fee)
  const sorted = [...members].sort((a, b) => {
    const aIsBoomerang = isBoomerangEmail(a.email) ? 1 : 0;
    const bIsBoomerang = isBoomerangEmail(b.email) ? 1 : 0;
    if (aIsBoomerang !== bIsBoomerang) return aIsBoomerang - bIsBoomerang;
    // Prefer active status
    const aActive = a.status === 'active' ? 0 : 1;
    const bActive = b.status === 'active' ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    // Prefer higher monthly amount
    return parseFloat(b.monthlyAmount || '0') - parseFloat(a.monthlyAmount || '0');
  });

  const primary = sorted[0]; // Keep this record
  const duplicateRecords = sorted.slice(1); // Delete these

  console.log(`\nMerging "${normalizedName}":`);
  console.log(`  Primary: [${primary.id}] ${primary.name} | ${primary.email} | ${primary.status}`);
  duplicateRecords.forEach(d => console.log(`  Duplicate: [${d.id}] ${d.name} | ${d.email} | ${d.status}`));

  // Collect all boomerang emails from duplicates
  const boomerangEmails = [];
  for (const dup of [...sorted]) {
    if (isBoomerangEmail(dup.email)) boomerangEmails.push(dup.email);
    if (dup.boomerangEmail) boomerangEmails.push(dup.boomerangEmail);
  }
  const uniqueBoomerangEmails = [...new Set(boomerangEmails)];

  // Collect the best values from all records
  const bestMonthlyAmount = Math.max(...members.map(m => parseFloat(m.monthlyAmount || '0')));
  const bestStatus = members.some(m => m.status === 'active') ? 'active' : primary.status;
  const mergedNotes = [
    primary.notes,
    ...duplicateRecords.map(d => d.notes).filter(Boolean),
    uniqueBoomerangEmails.length > 0 ? `Boomerang emails: ${uniqueBoomerangEmails.join(', ')}` : null,
    `Merged from duplicate IDs: ${duplicateRecords.map(d => d.id).join(', ')} on ${new Date().toISOString().split('T')[0]}`
  ].filter(Boolean).join(' | ');

  // Clean primary name (remove "(pro membership)" suffix)
  const cleanName = primary.name
    .replace(/\s*\(pro\s*membership\)/gi, '')
    .replace(/\s*\(promembership\)/gi, '')
    .trim();

  // Update primary record
  await conn.execute(`
    UPDATE members SET
      name = ?,
      boomerangEmail = ?,
      monthlyAmount = ?,
      status = ?,
      notes = ?,
      updatedAt = NOW()
    WHERE id = ?
  `, [
    cleanName,
    uniqueBoomerangEmails[0] || primary.boomerangEmail || null,
    bestMonthlyAmount.toFixed(2),
    bestStatus,
    mergedNotes,
    primary.id
  ]);
  console.log(`  ✓ Updated primary [${primary.id}] with boomerangEmail: ${uniqueBoomerangEmails[0] || 'none'}`);

  // Delete duplicate records
  for (const dup of duplicateRecords) {
    await conn.execute('DELETE FROM members WHERE id = ?', [dup.id]);
    console.log(`  ✓ Deleted duplicate [${dup.id}] ${dup.name}`);
  }
}

console.log('\n=== Step 5: Also clean up non-duplicate Boomerang-named records ===');
// Any remaining records with "(pro membership)" in name but no duplicate — just clean the name
const [boomerangNamed] = await conn.execute(`
  SELECT id, name, email FROM members 
  WHERE membershipTier = 'golf_vx_pro' 
  AND (name LIKE '%(pro membership)%' OR name LIKE '%(promembership)%')
`);
for (const m of boomerangNamed) {
  const cleanName = m.name
    .replace(/\s*\(pro\s*membership\)/gi, '')
    .replace(/\s*\(promembership\)/gi, '')
    .trim();
  const boomerangEmail = m.email.includes('@boomerang-import.golfvx.com') ? m.email : null;
  await conn.execute(`
    UPDATE members SET name = ?, boomerangEmail = COALESCE(boomerangEmail, ?) WHERE id = ?
  `, [cleanName, boomerangEmail, m.id]);
  console.log(`  ✓ Cleaned name: "${m.name}" → "${cleanName}" | boomerangEmail: ${boomerangEmail || 'unchanged'}`);
}

console.log('\n=== Final pro member list ===');
const [finalList] = await conn.execute(`
  SELECT id, name, email, boomerangEmail, status, monthlyAmount, joinDate
  FROM members 
  WHERE membershipTier = 'golf_vx_pro'
  ORDER BY name
`);
finalList.forEach(m => {
  console.log(`  [${m.id}] ${m.name}`);
  console.log(`       Primary email: ${m.email}`);
  if (m.boomerangEmail) console.log(`       Boomerang email: ${m.boomerangEmail}`);
  console.log(`       Status: ${m.status} | $${m.monthlyAmount}/mo`);
});

await conn.end();
console.log('\n✓ Migration complete!');
