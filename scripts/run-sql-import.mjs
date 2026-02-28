import "dotenv/config";
import mysql from "mysql2/promise";
import { readFileSync } from "fs";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const sql = readFileSync("/tmp/insert_members.sql", "utf8");
const statements = sql.split(";\n").filter((s) => s.trim().length > 0);

console.log("Executing", statements.length, "statements...");
let ok = 0, skip = 0;

for (const stmt of statements) {
  const trimmed = stmt.trim();
  if (!trimmed) continue;
  if (trimmed.startsWith("SET")) {
    await conn.execute(trimmed);
    continue;
  }
  try {
    const [result] = await conn.execute(trimmed);
    if (result.affectedRows > 0) ok++;
    else skip++;
  } catch (e) {
    skip++;
  }
}

const [count] = await conn.execute("SELECT COUNT(*) as total FROM members");
console.log(`Inserted: ${ok} | Skipped (duplicates): ${skip}`);
console.log(`New total member count: ${count[0].total}`);
await conn.end();
