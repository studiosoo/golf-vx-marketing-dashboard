# Production-Safe Testing Rules

This document outlines the strict guidelines for testing changes to the Golf VX Marketing Dashboard without compromising the integrity of the production environment, corrupting live data, or triggering unintended actions via external APIs.

## The Danger of Local Testing

Testing the application locally or within a development sandbox carries significant risk because the backend is deeply intertwined with external production systems.

If the application is started locally with production API keys, any action taken in the local UI may trigger real-world consequences. For example, creating a test campaign might launch actual ads on Meta, syncing data might overwrite production records in Encharge, and testing form submissions might send real confirmation emails via SendGrid.

Therefore, local testing must never use production credentials for write operations unless explicitly designed to do so safely.

## Database Testing Protocol

The production MySQL database must never be used for local development or automated testing.

Developers must use a separate, dedicated development database. The `DATABASE_URL` in the local `.env` file must point to this isolated instance. When writing tests, particularly those involving database operations, the testing framework (Vitest) should be configured to use a test-specific database or utilize mocking to intercept database calls.

Running Drizzle migrations locally uses the `pnpm db:push` command, which runs `drizzle-kit generate` (creates a new SQL migration file) followed by `drizzle-kit migrate` (applies it). This should only be performed against the local development database to verify schema changes before they are committed and eventually deployed to production. Note that `pnpm db:push` is not the same as `drizzle-kit push` — it does not bypass the migration file system.

## Mocking External APIs

To safely test backend logic that interacts with external services, developers must rely on mocking.

The application communicates with services like Acuity, Toast, and Meta Ads. When writing unit or integration tests, the Axios or Fetch calls to these APIs must be intercepted and replaced with mock responses. This ensures that tests can verify the application's internal logic without sending requests to the actual external services.

For manual local testing, if sandbox API keys are not available for a specific service, developers should temporarily comment out the external API call and log the intended action to the console instead.

## Scheduled Job Safety

The application relies on `node-cron` to run scheduled jobs that synchronize data from various sources. These jobs are defined in `server/scheduledJobs.ts`.

When running the application locally for development, these scheduled jobs should generally be disabled to prevent the local instance from interfering with the production synchronization process. If a developer needs to test a specific job, they should execute the underlying function manually rather than relying on the cron scheduler, and ensure they are connected to a development database.

If a scheduled job involves writing data to an external API (e.g., syncing contacts to Encharge), the developer must ensure they are using a sandbox API key or have mocked the write operation before executing the function locally.
