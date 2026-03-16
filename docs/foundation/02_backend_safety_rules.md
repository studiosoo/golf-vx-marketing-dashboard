# Backend Safety Rules

This document defines the strict safety protocols that must be followed when making any modifications to the backend logic, database schema, or background processes of the Golf VX Marketing Dashboard.

## High-Risk Components

The backend architecture contains several high-risk components that require extreme caution when modified. These components are critical to the daily operations and revenue tracking of the business.

The scheduled jobs, defined in `server/scheduledJobs.ts`, orchestrate vital data synchronization. Modifying these cron schedules or the underlying sync logic can disrupt data flow from Toast POS, ClickFunnels, Encharge, and the Google Sheets legacy system.

The external API integrations, such as Meta Ads, Acuity, and Toast, are highly sensitive. Changes to these integrations can break authentication, alter data ingestion formats, or trigger rate limits. Any modification must be thoroughly tested against sandbox environments before production deployment.

## Database Migration Protocol

The application relies on Drizzle ORM for database management. Direct SQL modifications to the production database are strictly prohibited.

All schema changes must be defined in `drizzle/schema.ts`. After modifying the schema, developers must run `pnpm db:push` to generate a new migration file and apply it. This command runs `drizzle-kit generate` (which creates a new SQL migration file in the `drizzle/` directory) followed by `drizzle-kit migrate` (which applies pending migrations). Migrations must be reviewed to ensure they do not result in data loss, particularly when dropping columns or altering data types.

In the production Railway deployment, migrations are applied by the `startup.sh` script via `scripts/run-migrations.mjs`. However, this only occurs if Railway is configured to run `startup.sh` as the start command. See `04_deployment_truth.md` for the current state of the Railway start command configuration.

## Environment Variable Handling

Environment variables control the application's connection to databases, external APIs, and internal services. Modifying these variables carries a high risk of application failure.

The central configuration object for the backend is `server/_core/env.ts`. This file consolidates the most common environment variables into a typed `ENV` object. Developers should prefer accessing variables through this object where possible.

However, it is important to note that many server files access `process.env` directly rather than through the `ENV` object. This is an established pattern in the codebase for integration-specific variables such as `ACUITY_USER_ID`, `META_ADS_ACCESS_TOKEN`, `BOOMERANG_API_TOKEN`, `CLICKFUNNELS_API_KEY`, and others. This is not a bug, but it means that not all environment variables are centralized in `env.ts`. Developers adding new integrations should follow the existing pattern for that integration's file.

Developers must never hardcode sensitive values, such as API keys or database connection strings, directly into the source code. When adding a new environment variable, it must be documented in the `.env.example` file to ensure the development team is aware of the new requirement. The actual secret values must be securely managed within the Railway deployment dashboard.

## Legacy System Caution

The Google Sheets synchronization logic, found in `server/googleSheets.ts` and `server/googleSheetsSync.ts`, is considered legacy and fragile. The primary application flow now writes data directly to the MySQL database.

Specifically, `server/googleSheets.ts` contains functions that are explicitly no-ops — they log a message but perform no action, as rclone is not available in the deployed environment. However, `server/googleSheetsSync.ts` is an active, functional module that reads from a publicly shared Google Sheet via CSV export and syncs its contents into the MySQL database. This sync job is still scheduled and runs three times daily.

Modifications to the Google Sheets sync logic should be avoided unless absolutely necessary to fix a critical bug. Any changes must ensure they do not overwrite or conflict with data that has already been saved directly to the MySQL database. The long-term goal is to deprecate this synchronization process entirely.
