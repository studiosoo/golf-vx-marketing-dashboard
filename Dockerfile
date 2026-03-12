FROM node:22-slim

# Install build tools needed for native modules
RUN apt-get update && apt-get install -y python3 make g++ --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@10.4.1

WORKDIR /app

# Copy package files and scripts needed for postinstall
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
COPY scripts/ ./scripts/

# Install dependencies
# better-sqlite3 is excluded via neverBuiltDependencies in package.json
RUN pnpm install --frozen-lockfile

# Copy remaining source code
COPY . .

# VITE_ variables must be available at BUILD TIME (not runtime) because Vite
# bakes them into the JS bundle during compilation. Pass them as build args.
ARG VITE_APP_ID
ARG VITE_OAUTH_PORTAL_URL
ARG VITE_APP_TITLE
ARG VITE_APP_LOGO
ARG VITE_FRONTEND_FORGE_API_URL
ARG VITE_FRONTEND_FORGE_API_KEY
ARG VITE_ANALYTICS_ENDPOINT
ARG VITE_ANALYTICS_WEBSITE_ID

# Make build args available as environment variables for Vite
ENV VITE_APP_ID=$VITE_APP_ID
ENV VITE_OAUTH_PORTAL_URL=$VITE_OAUTH_PORTAL_URL
ENV VITE_APP_TITLE=$VITE_APP_TITLE
ENV VITE_APP_LOGO=$VITE_APP_LOGO
ENV VITE_FRONTEND_FORGE_API_URL=$VITE_FRONTEND_FORGE_API_URL
ENV VITE_FRONTEND_FORGE_API_KEY=$VITE_FRONTEND_FORGE_API_KEY
ENV VITE_ANALYTICS_ENDPOINT=$VITE_ANALYTICS_ENDPOINT
ENV VITE_ANALYTICS_WEBSITE_ID=$VITE_ANALYTICS_WEBSITE_ID

# Build the application (Vite will bake VITE_ env vars into the bundle)
RUN pnpm build

# Expose port
EXPOSE 3002

# Start the application
CMD ["node", "dist/index.js"]
