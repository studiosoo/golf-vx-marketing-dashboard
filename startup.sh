#!/bin/sh
set -e

echo "[Startup] Golf VX Dashboard starting..."

# Copy Meta Ads cache to /tmp (where the server reads it from)
if [ -f "/app/.meta-ads-cache/insights.json" ]; then
  echo "[Startup] Copying Meta Ads cache to /tmp..."
  cp /app/.meta-ads-cache/insights.json /tmp/golf-vx-meta-ads-insights.json
  echo "[Startup] Meta Ads cache copied ($(wc -c < /tmp/golf-vx-meta-ads-insights.json) bytes)"
else
  echo "[Startup] No Meta Ads cache found at /app/.meta-ads-cache/insights.json"
fi

# Run database migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "[Startup] Running database migrations..."
  # Wait for MySQL to be ready (up to 60 seconds)
  MAX_TRIES=12
  TRIES=0
  until node -e "
    const mysql = require('mysql2/promise');
    mysql.createConnection(process.env.DATABASE_URL)
      .then(c => { c.end(); process.exit(0); })
      .catch(() => process.exit(1));
  " 2>/dev/null; do
    TRIES=$((TRIES + 1))
    if [ $TRIES -ge $MAX_TRIES ]; then
      echo "[Startup] Database not ready after ${MAX_TRIES} attempts, skipping migrations"
      break
    fi
    echo "[Startup] Waiting for database... (attempt $TRIES/$MAX_TRIES)"
    sleep 5
  done

  if [ $TRIES -lt $MAX_TRIES ]; then
    echo "[Startup] Database is ready. Running migrations..."
    cd /app && node_modules/.bin/drizzle-kit migrate --config drizzle.config.ts 2>&1 || echo "[Startup] Migration warning (may already be up to date)"
    echo "[Startup] Migrations complete."
  fi
else
  echo "[Startup] No DATABASE_URL set, skipping migrations"
fi

echo "[Startup] Starting server..."
exec node /app/dist/index.js
