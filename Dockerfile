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
RUN pnpm install --frozen-lockfile

# Copy remaining source code
COPY . .

# VITE_ variables must be baked into the JS bundle at BUILD TIME.
# Hardcode them here so Railway doesn't need to pass them as build args.
ENV VITE_APP_ID=golf-vx-arlington-heights
ENV VITE_OAUTH_PORTAL_URL=https://golf-vx-dashboard-production.up.railway.app
ENV VITE_APP_TITLE="Golf VX Arlington Heights"

# Build the application (Vite will bake VITE_ env vars into the bundle)
RUN pnpm build

# Make startup script executable
RUN chmod +x /app/startup.sh

# Expose port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Use startup script to run migrations and start server
CMD ["/app/startup.sh"]
