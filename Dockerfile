FROM node:22-slim

# Install build tools needed for native modules (but we'll prevent better-sqlite3 from compiling)
RUN apt-get update && apt-get install -y python3 make g++ --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@10.4.1

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install dependencies with full scripts enabled so platform-specific binaries
# (rollup, esbuild, etc.) are properly downloaded/compiled.
# better-sqlite3 is NOT in onlyBuiltDependencies so it won't run its install script.
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Expose port
EXPOSE 3002

# Start the application
CMD ["node", "dist/index.js"]
