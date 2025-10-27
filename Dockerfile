# Dockerfile for Nuxt 4 + Canvas (Server-Side Chart Rendering)
# Multi-stage build for smaller final image and better caching

# Build stage
FROM node:22-alpine AS builder

# Install canvas native dependencies (needed for build)
RUN apk add --no-cache \
  build-base \
  cairo-dev \
  pango-dev \
  jpeg-dev \
  giflib-dev \
  librsvg-dev \
  pixman-dev

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Build Nuxt application
# Set CI=true to skip prerendering during build (pages will be SSR'd at runtime)
ENV NODE_ENV=production
RUN CI=true npm run build

# Production stage
FROM node:22-alpine

# Install only runtime dependencies for canvas
RUN apk add --no-cache \
  cairo \
  pango \
  jpeg \
  giflib \
  librsvg \
  pixman

WORKDIR /app

# Copy built application and node_modules from builder
COPY --from=builder /app/.output /app/.output
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package*.json ./

# Set environment to production
ENV NODE_ENV=production

# Default port (can be overridden with -e PORT=xxxx)
ENV PORT=5000

# Health check (uses PORT env var)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start Nuxt server
CMD ["node", ".output/server/index.mjs"]
