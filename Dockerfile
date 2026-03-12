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
# All other platform-specific binaries (rollup, esbuild) will compile/download normally
RUN pnpm install --frozen-lockfile

# Copy remaining source code
COPY . .

# Build the application
RUN pnpm build

# Expose port
EXPOSE 3002

# Start the application
CMD ["node", "dist/index.js"]
