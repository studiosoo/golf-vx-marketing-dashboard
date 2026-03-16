# System Truth

This document outlines the fundamental architectural and operational truths of the Golf VX Marketing Dashboard. It serves as the baseline understanding for all development and operational tasks.

## Core Architecture

The application is a modern, full-stack monorepo. It does not use separate repositories for the frontend and backend.

The frontend is built with React 19, styled using Tailwind CSS 4, and utilizes shadcn/ui components. It is compiled using Vite.

The backend is built on Node.js and Express. It utilizes tRPC 11 to establish type-safe API communication between the frontend client and the backend server. The backend logic handles all database interactions, external API integrations, and scheduled background jobs.

## Database Infrastructure

The primary and only database system is MySQL, specifically optimized for TiDB. The application uses Drizzle ORM to manage database schema, queries, and migrations.

The application does not use Supabase, PostgreSQL, Firebase, or SQLite for its primary data storage. All persistent application data, including user information, campaign metrics, and form submissions, resides in the MySQL database.

## State and Caching

The application relies on a local JSON file (`/tmp/golf-vx-meta-ads-insights.json` and `.meta-ads-cache/insights.json`) to cache Meta Ads insights. This cache is used to prevent rate-limiting from the Meta API.

This local JSON cache is not the source of truth. It is ephemeral data. If the application container restarts, this cache may be lost until the next scheduled refresh script runs. The MySQL database remains the sole source of truth for all persistent data.

## External Dependencies

The backend is heavily integrated with numerous external APIs. These include Meta Ads, Acuity Scheduling, Encharge, Boomerang POS, Toast POS, ClickFunnels, Stripe, Twilio, SendGrid, and OpenAI/Gemini. The system relies on these external services for data ingestion, communication, and artificial intelligence features.

There is a legacy integration with Google Sheets, primarily used for syncing Giveaway applications. This integration should be considered fragile and is treated as a secondary data source, as the primary application flow now saves this data directly to the MySQL database.
