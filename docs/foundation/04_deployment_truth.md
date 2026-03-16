# Deployment Truth

This document outlines the deployment architecture and hosting environment for the Golf VX Marketing Dashboard. It defines how the application is packaged, where it runs, and how environment variables are managed in production.

## Containerization and Hosting

The application is deployed using Railway, a modern Platform as a Service (PaaS). Railway is responsible for building the application container and hosting the resulting Node.js process.

The build process is governed by the `Dockerfile` located in the root of the repository. This file instructs Railway to use a Node.js 22 environment, install dependencies via pnpm, build the Vite frontend, and compile the Express backend. The final artifact is a single Docker container that encompasses both the client and server code.

The `railway.json` configuration file specifies that the container should be started using the command `node dist/index.js`. This starts the Express server, which serves the built React frontend and handles all API requests.

## Stateless Application Design

The deployed container is designed to be largely stateless. This means that the container can be restarted, scaled, or destroyed without losing critical application data.

Because Railway hosts only the application container, the production data is not stored within the container itself, nor is it stored within the Manus development environment. The application relies entirely on external services for state management.

The primary state is maintained in the external MySQL/TiDB database. The application connects to this database via the `DATABASE_URL` environment variable. Any local files written by the application, such as the Meta Ads JSON cache in `/tmp`, are ephemeral and will be lost if the container restarts.

## Environment Configuration

Environment variables are the sole mechanism for configuring the application in different environments (development, staging, production).

In the Railway production environment, all sensitive credentials, API keys, and database connection strings are managed through the Railway dashboard. These variables are injected into the container at runtime.

The `Dockerfile` explicitly bakes certain `VITE_` prefixed environment variables into the frontend JavaScript bundle during the build phase. This ensures the frontend has access to necessary public configuration without exposing backend secrets. All backend secrets are accessed dynamically at runtime via `process.env` in the Node.js server.

## Migration Execution

Database migrations are executed automatically during the application startup sequence.

The `startup.sh` script, which is the entry point for the Docker container, checks for the presence of the `DATABASE_URL` environment variable. If present, it waits for the database to become available and then runs the Drizzle migration script (`scripts/run-migrations.mjs`). This ensures that the database schema is always in sync with the deployed application code before the server begins accepting traffic.
