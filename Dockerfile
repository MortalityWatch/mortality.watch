# Dockerfile for Nuxt 4 + Canvas (Server-Side Chart Rendering)
# Single-stage build using Node.js LTS for consistency

FROM node:24-slim

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
  git \
  && rm -rf /var/lib/apt/lists/*

# Install Bun for faster dependency installation
RUN npm install -g bun

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

# Set environment to production
ENV NODE_ENV=production

# Default port (can be overridden with -e PORT=xxxx)
ENV PORT=5000

# Health check (uses PORT env var)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start Nuxt server
CMD ["node", ".output/server/index.mjs"]
