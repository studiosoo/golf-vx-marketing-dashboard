/**
 * sync-boomerang-tiers.mjs
 * Fetches all clients from every Boomerang template (using getClientsList)
 * and updates membershipTier in the members table based on which template they belong to.
 *
 * Template → membershipTier mapping:
 *   Swing Savers*         → swing_savers
 *   All-Access Aces*      → all_access_aces
 *   Pro Membership        → golf_vx_pro
 *   Summer Pass*          → golf_vx_pro
 *   *Trial*               → trial
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';

const token = process.env.BOOMERANG_API_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;
const BASE = 'https://app.boomerangme.cards/api/v1';

if (!token) { console.error('BOOMERANG_API_TOKEN not set'); process.exit(1); }
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

// ── Boomerang API helper (POST) ──────────────────────────────────────────────
async function api(method, body = {}) {
  const r = await fetch(`${BASE}/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Key': token,
      'x-access-token': token,
    },
    body: JSON.stringify({ token, ...body }),
  });
  const text = await r.text();
  try { return JSON.parse(text); } catch { return null; }
}

// ── Template → tier mapping ──────────────────────────────────────────────────
function templateToTier(templateName) {
  const n = templateName.toLowerCase().trim();
  if (n.includes('trial')) return 'trial';
  if (n.includes('swing savers')) return 'swing_savers';
  if (n.includes('all-access aces') || n.includes('all access aces')) return 'all_access_aces';
  if (n.includes('pro membership') || n.includes('summer pass')) return 'golf_vx_pro';
  return null; // unknown — skip
}

// ── Fetch all clients for a template (paginated) ─────────────────────────────
async function getAllClientsForTemplate(templateId, templateName) {
  const clients = [];
  let page = 1;
  while (true) {
    const data = await api('getClientsList', { idTemplate: templateId, page });
    if (!data?.rows?.length) break;
    clients.push(...data.rows);
    process.stdout.write(`  Page ${page}: ${data.rows.length} rows (total: ${clients.length})\n`);
    if (data.rows.length < 100) break; // last page (API returns up to 100 per page)
    page++;
    await new Promise(r => setTimeout(r, 300)); // rate limit
  }
  return clients;
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log('Fetching Boomerang templates...');
const templatesData = await api('getTemplates');
const templates = templatesData?.templates || [];
console.log(`Found ${templates.length} templates\n`);

// Build email → tier and phone → tier maps from all templates
const emailToTier = new Map(); // email (lowercase) → { tier, templateName }
const phoneToTier = new Map(); // digits-only phone → { tier, templateName }

for (const tmpl of templates) {
  const tier = templateToTier(tmpl.name);
  if (!tier) {
    console.log(`Skipping template "${tmpl.name}" (no tier mapping)`);
    continue;
  }
  console.log(`Fetching clients for "${tmpl.name}" (${tmpl.id}) → ${tier}`);
  const clients = await getAllClientsForTemplate(tmpl.id, tmpl.name);
  console.log(`  → ${clients.length} total clients\n`);

  for (const c of clients) {
    const email = (c.email || '').toLowerCase().trim();
    const phone = (c.phone || '').replace(/\D/g, '');
    // Higher-priority tiers win (all_access_aces > swing_savers > trial)
    const tierPriority = { all_access_aces: 3, golf_vx_pro: 2, swing_savers: 1, trial: 0 };
    if (email) {
      const existing = emailToTier.get(email);
      if (!existing || (tierPriority[tier] ?? -1) > (tierPriority[existing.tier] ?? -1)) {
        emailToTier.set(email, { tier, templateName: tmpl.name });
      }
    }
    if (phone) {
      const existing = phoneToTier.get(phone);
      if (!existing || (tierPriority[tier] ?? -1) > (tierPriority[existing.tier] ?? -1)) {
        phoneToTier.set(phone, { tier, templateName: tmpl.name });
      }
    }
  }
}

console.log(`\nTotal unique emails mapped: ${emailToTier.size}`);
console.log(`Total unique phones mapped: ${phoneToTier.size}`);

// ── Connect to DB and update members ─────────────────────────────────────────
const db = await mysql.createConnection(DATABASE_URL);
const [members] = await db.execute('SELECT id, email, phone, membershipTier FROM members');
console.log(`\nTotal members in DB: ${members.length}`);

let updated = 0;
let alreadyCorrect = 0;
let notFound = 0;
const tierCounts = {};

for (const member of members) {
  const email = (member.email || '').toLowerCase().trim();
  const phone = (member.phone || '').replace(/\D/g, '');

  const match = emailToTier.get(email) || phoneToTier.get(phone);

  if (match) {
    tierCounts[match.tier] = (tierCounts[match.tier] || 0) + 1;
    if (member.membershipTier !== match.tier) {
      await db.execute(
        'UPDATE members SET membershipTier = ?, updatedAt = NOW() WHERE id = ?',
        [match.tier, member.id]
      );
      updated++;
    } else {
      alreadyCorrect++;
    }
  } else {
    notFound++;
  }
}

await db.end();

console.log('\n=== SYNC COMPLETE ===');
console.log(`Updated:          ${updated}`);
console.log(`Already correct:  ${alreadyCorrect}`);
console.log(`Not found:        ${notFound}`);
console.log('\nMatched tier distribution:');
for (const [tier, count] of Object.entries(tierCounts).sort((a,b) => b[1]-a[1])) {
  console.log(`  ${tier}: ${count}`);
}

// Final DB counts
const db2 = await mysql.createConnection(DATABASE_URL);
const [finalTiers] = await db2.execute('SELECT membershipTier, COUNT(*) as cnt FROM members GROUP BY membershipTier ORDER BY cnt DESC');
await db2.end();
console.log('\nFinal DB tier distribution:');
for (const row of finalTiers) {
  console.log(`  ${row.membershipTier}: ${row.cnt}`);
}
