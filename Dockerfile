FROM node:22-slim

# Install pnpm
RUN npm install -g pnpm@10.4.1

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install dependencies, skipping native module compilation
# better-sqlite3 is an optional peer dep of drizzle-orm and NOT used in this app
RUN pnpm install --frozen-lockfile --ignore-scripts --no-optional

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Expose port
EXPOSE 3002

# Start the application
CMD ["node", "dist/index.js"]
