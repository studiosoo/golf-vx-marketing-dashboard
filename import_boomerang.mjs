import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { parse } from 'url';

// Read Excel using a simple approach - we'll use the data we already parsed
// Since openpyxl already confirmed the data, let's use a direct SQL approach
// to complete the import for any missing records

const dbUrl = process.env.DATABASE_URL;
const conn = await mysql.createConnection(dbUrl);

console.log('Connected to DB');

// Check current state
const [existing] = await conn.execute(
  'SELECT email, boomerang_card_status FROM email_captures WHERE source = "boomerang"'
);
const existingMap = new Map(existing.map(r => [r.email.toLowerCase(), r.boomerang_card_status]));

console.log(`Existing Boomerang records: ${existingMap.size}`);
console.log(`  installed: ${[...existingMap.values()].filter(v => v === 'installed').length}`);
console.log(`  deleted: ${[...existingMap.values()].filter(v => v === 'deleted').length}`);
console.log(`  not_installed: ${[...existingMap.values()].filter(v => v === 'not_installed').length}`);
console.log(`  null: ${[...existingMap.values()].filter(v => v === null).length}`);

// Check total
const [total] = await conn.execute('SELECT COUNT(*) as cnt FROM email_captures WHERE source = "boomerang"');
console.log(`Total Boomerang in DB: ${total[0].cnt}`);

// Check if there are still null card status records that need updating
const [nullStatus] = await conn.execute(
  'SELECT COUNT(*) as cnt FROM email_captures WHERE source = "boomerang" AND boomerang_card_status IS NULL'
);
console.log(`Records with null card status: ${nullStatus[0].cnt}`);

await conn.end();
console.log('Done');
