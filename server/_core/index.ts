import "dotenv/config";
import express from "express";

// Suppress corrupted sandbox filesystem errors (errno -117) that crash the Vite FSWatcher.
// These errors come from chokidar trying to lstat .manus/.meta-ads-cache directories
// which have corrupted inodes in the sandbox filesystem and cannot be removed.
// Without this handler, the error propagates as an unhandled 'error' event and kills the process.
process.on("uncaughtException", (err: NodeJS.ErrnoException) => {
  if (err.errno === -117 || (err as any).code === "Unknown system error -117") {
    // Silently ignore — this is a sandbox filesystem artifact, not a real error
    return;
  }
  // Re-throw all other uncaught exceptions
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason: any) => {
  if (reason?.errno === -117 || reason?.code === "Unknown system error -117") {
    return;
  }
  console.error("Unhandled Rejection:", reason);
});
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startScheduler } from "../scheduler";
import { handleBoomerangWebhookRoute } from "../boomerangWebhook";
import { handleStripeWebhookRoute } from "../stripeWebhook";
import { handleMembershipWebhookRoute } from "../membershipWebhook";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function runStartupMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('[Migration] No DATABASE_URL, skipping migrations');
    return;
  }
  try {
    const mysql = await import('mysql2/promise');
    const fs = await import('fs');
    const path = await import('path');
    const connection = await mysql.default.createConnection(databaseUrl);
    console.log('[Migration] Connected to database');
    await connection.execute(`CREATE TABLE IF NOT EXISTS \`__drizzle_migrations\` (id INT AUTO_INCREMENT PRIMARY KEY, hash VARCHAR(255) NOT NULL UNIQUE, created_at BIGINT)`);
    const migrationsDir = path.default.join(process.cwd(), 'drizzle');
    const journalPath = path.default.join(migrationsDir, 'meta', '_journal.json');
    if (!fs.default.existsSync(journalPath)) { await connection.end(); return; }
    const journal = JSON.parse(fs.default.readFileSync(journalPath, 'utf-8'));
    const entries = journal.entries || [];
    console.log(`[Migration] Found ${entries.length} migration(s)`);
    for (const entry of entries) {
      const { tag, when } = entry;
      const [rows] = await connection.execute('SELECT id FROM `__drizzle_migrations` WHERE hash = ?', [tag]) as any;
      if (rows.length > 0) continue;
      const sqlFile = fs.default.readdirSync(migrationsDir).find((f: string) => f.endsWith('.sql') && f.replace('.sql', '') === tag);
      if (!sqlFile) continue;
      const sql = fs.default.readFileSync(path.default.join(migrationsDir, sqlFile), 'utf-8');
      const statements = sql.split('--> statement-breakpoint').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      console.log(`[Migration] Applying ${tag} (${statements.length} statements)...`);
      for (const stmt of statements) {
        try { await connection.execute(stmt); }
        catch (e: any) { if (!['ER_TABLE_EXISTS_ERROR','ER_DUP_KEYNAME','ER_DUP_ENTRY'].includes(e.code)) console.warn(`[Migration] Warning:`, e.message); }
      }
      await connection.execute('INSERT INTO `__drizzle_migrations` (hash, created_at) VALUES (?, ?)', [tag, when || Date.now()]);
      console.log(`[Migration] Applied ${tag}`);
    }
    await connection.end();
    console.log('[Migration] All migrations complete');
  } catch (err: any) {
    console.error('[Migration] Error:', err.message);
  }
}

async function copyMetaAdsCache() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const srcPath = path.default.join(process.cwd(), '.meta-ads-cache', 'insights.json');
    const destPath = '/tmp/golf-vx-meta-ads-insights.json';
    if (fs.default.existsSync(srcPath) && !fs.default.existsSync(destPath)) {
      fs.default.copyFileSync(srcPath, destPath);
      console.log('[Startup] Meta Ads cache copied from bundle to /tmp');
    }
  } catch (e: any) {
    console.warn('[Startup] Could not copy Meta Ads cache:', e.message);
  }
}

async function startServer() {
  await copyMetaAdsCache();
  await runStartupMigrations();
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Stripe webhook — MUST be registered BEFORE global json() middleware
  // Stripe requires the raw request body for signature verification
  app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), handleStripeWebhookRoute);
  // Boomerang loyalty card webhook (Make.com → Golf VX)
  app.post("/api/webhooks/boomerang", handleBoomerangWebhookRoute);
  // Membership lifecycle events webhook (Make.com → Golf VX — logs full history + Encharge tags)
  app.post("/api/webhooks/boomerang-membership", handleMembershipWebhookRoute);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start autonomous marketing intelligence scheduler (8am/6pm CST)
    startScheduler();
    // Ensure Meta Ads cache is populated on startup (cache lives in /tmp and is cleared on reboot)
    import('../metaAdsCache').then(({ readMetaAdsCache }) => {
      const existing = readMetaAdsCache();
      if (existing.length === 0) {
        console.log('[Startup] Meta Ads cache empty, triggering MCP refresh...');
        import('../refreshMetaAdsCache').then(({ refreshMetaAdsCache }) => {
          refreshMetaAdsCache()
            .then(result => console.log('[Startup] Meta Ads cache refresh:', result.message))
            .catch(err => console.warn('[Startup] Meta Ads cache refresh failed:', err));
        }).catch(() => {});
      } else {
        console.log(`[Startup] Meta Ads cache ready: ${existing.length} campaigns`);
      }
    }).catch(() => {});
  });
}

startServer().catch(console.error);
