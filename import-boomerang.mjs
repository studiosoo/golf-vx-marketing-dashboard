// Run from project root: node import-boomerang.mjs
import { readFileSync } from 'fs';
import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const contacts = JSON.parse(readFileSync('/tmp/boomerang_contacts.json', 'utf8'));
console.log(`Importing ${contacts.length} contacts...`);

const connection = await createConnection(process.env.DATABASE_URL);

// Check existing boomerang records
const [existing] = await connection.execute(
  "SELECT email, phone FROM email_captures WHERE source = 'boomerang'"
);
const existingEmails = new Set(existing.map(r => r.email).filter(Boolean).map(e => e.toLowerCase()));
const existingPhones = new Set(existing.map(r => r.phone).filter(Boolean));
console.log(`Existing Boomerang records: ${existing.length}`);

let inserted = 0;
let skipped = 0;
let errors = 0;

for (const contact of contacts) {
  const emailKey = contact.email ? contact.email.toLowerCase() : null;
  
  // Skip if already exists
  if (emailKey && existingEmails.has(emailKey)) { skipped++; continue; }
  if (contact.phone && existingPhones.has(contact.phone)) { skipped++; continue; }

  try {
    await connection.execute(
      `INSERT INTO email_captures 
       (email, first_name, last_name, phone, source, source_detail, status, 
        boomerang_card_serial, captured_at, tags, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        contact.email || null,
        contact.first_name || null,
        contact.last_name || null,
        contact.phone || null,
        contact.source,
        contact.source_detail || null,
        contact.status,
        contact.boomerang_card_serial || null,
        contact.captured_at,
        contact.tags || null,
        contact.notes || null,
      ]
    );
    inserted++;
    if (emailKey) existingEmails.add(emailKey);
    if (contact.phone) existingPhones.add(contact.phone);
  } catch (err) {
    errors++;
    if (errors <= 3) console.error(`Error inserting ${contact.email}: ${err.message}`);
  }
}

console.log(`\nImport complete:`);
console.log(`  Inserted: ${inserted}`);
console.log(`  Skipped (duplicates): ${skipped}`);
console.log(`  Errors: ${errors}`);

// Final counts
const [counts] = await connection.execute(
  "SELECT status, COUNT(*) as count FROM email_captures WHERE source = 'boomerang' GROUP BY status"
);
console.log('\nBoomerang contacts by status:');
counts.forEach(r => console.log(`  ${r.status}: ${r.count}`));

const [total] = await connection.execute("SELECT COUNT(*) as total FROM email_captures");
console.log(`\nTotal email_captures: ${total[0].total}`);

await connection.end();
