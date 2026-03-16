# Deployment Truth

This document outlines the deployment architecture and hosting environment for the Golf VX Marketing Dashboard. It defines how the application is packaged, where it runs, and how environment variables are managed in production.

## Containerization and Hosting

The application is deployed using Railway, a modern Platform as a Service (PaaS). Railway is responsible for building the application container and hosting the resulting Node.js process.

The build process is governed by the `Dockerfile` located in the root of the repository. This file instructs Railway to use a Node.js 22 environment, install dependencies via pnpm, build the Vite frontend, and compile the Express backend. The final artifact is a single Docker container that encompasses both the client and server code.

## How the Application Actually Starts in Production

There are two start command definitions in the repository, and understanding which one takes precedence is critical.

The `Dockerfile` defines `CMD ["/app/startup.sh"]` as its default entry point. The `startup.sh` script performs pre-flight tasks — it copies the Meta Ads cache to `/tmp` and runs database migrations — before finally executing `node /app/dist/index.js`.

However, the `railway.json` configuration file defines a `startCommand` of `node dist/index.js`. **When Railway uses the Dockerfile builder and a `startCommand` is set in `railway.json`, Railway's `startCommand` overrides the Dockerfile `CMD` at runtime.** This means in production, Railway executes `node dist/index.js` directly, bypassing `startup.sh` entirely.

The practical consequence is that in the current Railway production configuration, **database migrations are not automatically applied on each deployment**, and the Meta Ads cache is not automatically copied to `/tmp` at startup. The `startup.sh` script exists and is correct, but it is not invoked by Railway due to the `startCommand` override.

To restore the intended behavior — automatic migrations and cache setup on each deploy — the `startCommand` in `railway.json` should be changed to `/app/startup.sh`, or the `startCommand` field should be removed so the Dockerfile `CMD` takes effect.

## Stateless Application Design

The deployed container is designed to be largely stateless. This means that the container can be restarted, scaled, or destroyed without losing critical application data.

Because Railway hosts only the application container, the production data is not stored within the container itself, nor is it stored within the Manus development environment. The application relies entirely on external services for state management.

The primary state is maintained in the external MySQL/TiDB database. The application connects to this database via the `DATABASE_URL` environment variable. Any local files written by the application, such as the Meta Ads JSON cache in `/tmp`, are ephemeral and will be lost if the container restarts.

## Environment Configuration

Environment variables are the sole mechanism for configuring the application in different environments (development, staging, production).

In the Railway production environment, all sensitive credentials, API keys, and database connection strings are managed through the Railway dashboard. These variables are injected into the container at runtime.

The `Dockerfile` explicitly bakes certain `VITE_` prefixed environment variables into the frontend JavaScript bundle during the build phase. This ensures the frontend has access to necessary public configuration without exposing backend secrets. All backend secrets are accessed dynamically at runtime via `process.env` in the Node.js server.

## Migration Execution

Database migrations are handled by the `startup.sh` script and the `scripts/run-migrations.mjs` file. When `startup.sh` runs, it checks for the presence of the `DATABASE_URL` environment variable, waits for the MySQL database to become available, and then executes `node /app/scripts/run-migrations.mjs`. This script reads the Drizzle migration journal and applies any pending SQL migration files in order.

As noted above, `startup.sh` is only invoked if Railway's `startCommand` is set to `/app/startup.sh`. If `startCommand` is set to `node dist/index.js`, migrations must be applied manually or through a separate Railway deploy hook.
