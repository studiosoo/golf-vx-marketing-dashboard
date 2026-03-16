# Backend Safety Rules

This document defines the strict safety protocols that must be followed when making any modifications to the backend logic, database schema, or background processes of the Golf VX Marketing Dashboard.

## High-Risk Components

The backend architecture contains several high-risk components that require extreme caution when modified. These components are critical to the daily operations and revenue tracking of the business.

The scheduled jobs, defined in `server/scheduledJobs.ts`, orchestrate vital data synchronization. Modifying these cron schedules or the underlying sync logic can disrupt data flow from Toast POS, ClickFunnels, Encharge, and the Google Sheets legacy system.

The external API integrations, such as Meta Ads, Acuity, and Toast, are highly sensitive. Changes to these integrations can break authentication, alter data ingestion formats, or trigger rate limits. Any modification must be thoroughly tested against sandbox environments before production deployment.

## Database Migration Protocol

The application relies on Drizzle ORM for database management. Direct SQL modifications to the production database are strictly prohibited.

All schema changes must be defined in `drizzle/schema.ts`. After modifying the schema, developers must generate a new migration file using the Drizzle CLI. Migrations must be reviewed to ensure they do not result in data loss, particularly when dropping columns or altering data types.

Migrations are automatically applied during the deployment process via the `startup.sh` script. Developers must not manually run migrations against the production database unless specifically authorized during an incident response.

## Environment Variable Handling

Environment variables control the application's connection to databases, external APIs, and internal services. Modifying these variables carries a high risk of application failure.

Developers must never hardcode sensitive values, such as API keys or database connection strings, directly into the source code. All secrets must be accessed exclusively through the `server/_core/env.ts` configuration object.

When adding a new environment variable, it must be documented in the `.env.example` file to ensure the development team is aware of the new requirement. The actual secret values must be securely managed within the Railway deployment dashboard.

## Legacy System Caution

The Google Sheets synchronization logic, found in `server/googleSheets.ts` and `server/googleSheetsSync.ts`, is considered legacy and fragile. The primary application flow now writes data directly to the MySQL database.

Modifications to the Google Sheets sync logic should be avoided unless absolutely necessary to fix a critical bug. Any changes must ensure they do not overwrite or conflict with data that has already been saved directly to the MySQL database. The long-term goal is to deprecate this synchronization process entirely.
