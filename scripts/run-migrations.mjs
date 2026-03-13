#!/usr/bin/env node
/**
 * Direct SQL migration runner for Railway deployment.
 * Runs all drizzle SQL migration files in order against the MySQL database.
 */
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, '..', 'drizzle');
const JOURNAL_FILE = path.join(MIGRATIONS_DIR, 'meta', '_journal.json');

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('[Migration] No DATABASE_URL set, skipping migrations');
    process.exit(0);
  }

  console.log('[Migration] Connecting to database...');
  
  let connection;
  try {
    connection = await mysql.createConnection(databaseUrl);
    console.log('[Migration] Connected to database');
  } catch (err) {
    console.error('[Migration] Failed to connect to database:', err.message);
    process.exit(1);
  }

  try {
    // Create migrations tracking table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`__drizzle_migrations\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hash VARCHAR(255) NOT NULL UNIQUE,
        created_at BIGINT
      )
    `);

    // Read journal to get migration order
    const journal = JSON.parse(fs.readFileSync(JOURNAL_FILE, 'utf-8'));
    const entries = journal.entries || [];

    console.log(`[Migration] Found ${entries.length} migration(s) in journal`);

    for (const entry of entries) {
      const { tag, when } = entry;
      
      // Check if already applied
      const [rows] = await connection.execute(
        'SELECT id FROM `__drizzle_migrations` WHERE hash = ?',
        [tag]
      );
      
      if (rows.length > 0) {
        console.log(`[Migration] Skipping ${tag} (already applied)`);
        continue;
      }

      // Find the SQL file
      const sqlFiles = fs.readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql') && f.startsWith(tag.split('_')[0]));
      
      // Find the exact file matching the tag
      const sqlFile = fs.readdirSync(MIGRATIONS_DIR)
        .find(f => f.endsWith('.sql') && f.replace('.sql', '') === tag);
      
      if (!sqlFile) {
        console.log(`[Migration] No SQL file found for ${tag}, skipping`);
        continue;
      }

      const sqlPath = path.join(MIGRATIONS_DIR, sqlFile);
      const sql = fs.readFileSync(sqlPath, 'utf-8');
      
      // Split by statement breakpoint and execute each statement
      const statements = sql
        .split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      console.log(`[Migration] Applying ${tag} (${statements.length} statements)...`);
      
      for (const statement of statements) {
        try {
          await connection.execute(statement);
        } catch (err) {
          // Ignore "already exists" errors for idempotent migrations
          if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_KEYNAME') {
            console.log(`[Migration] Skipping existing object in ${tag}`);
          } else {
            console.error(`[Migration] Error in ${tag}:`, err.message);
            throw err;
          }
        }
      }

      // Mark as applied
      await connection.execute(
        'INSERT INTO `__drizzle_migrations` (hash, created_at) VALUES (?, ?)',
        [tag, when || Date.now()]
      );
      
      console.log(`[Migration] Applied ${tag} successfully`);
    }

    console.log('[Migration] All migrations complete');
  } finally {
    await connection.end();
  }
}

runMigrations().catch(err => {
  console.error('[Migration] Fatal error:', err);
  process.exit(1);
});
