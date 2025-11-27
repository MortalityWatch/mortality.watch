# Dockerfile for Nuxt 4 + Canvas (Server-Side Chart Rendering)
# Multi-stage build for smaller final image and better caching
# Using Debian-based images for glibc compatibility with native modules

# Build stage
FROM oven/bun:1-debian AS builder

# Install canvas native dependencies (needed for build)
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  libpixman-1-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy application code
COPY . .

# Build Nuxt application
# Set CI=true to skip prerendering during build (pages will be SSR'd at runtime)
ENV NODE_ENV=production
RUN CI=true bun run build

# Production stage - use Node.js for runtime (better compatibility)
FROM node:22-slim

# Install build tools + runtime dependencies for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  python3 \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  libpixman-1-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/.output /app/.output
COPY --from=builder /app/package*.json ./

# Reinstall native modules from source for Node.js (Bun-compiled binaries don't work with Node)
RUN cd /app/.output/server && \
    rm -rf node_modules/better-sqlite3 node_modules/canvas && \
    npm install better-sqlite3 canvas --build-from-source

# Set environment to production
ENV NODE_ENV=production

# Default port (can be overridden with -e PORT=xxxx)
ENV PORT=5000

# Health check (uses PORT env var)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start Nuxt server
CMD ["node", ".output/server/index.mjs"]
