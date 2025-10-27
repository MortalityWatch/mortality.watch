# Dockerfile for Nuxt 4 + Canvas (Server-Side Chart Rendering)
FROM node:22-alpine

# Install canvas native dependencies
# Required for node-canvas to work in production
RUN apk add --no-cache \
  build-base \
  cairo-dev \
  pango-dev \
  jpeg-dev \
  giflib-dev \
  librsvg-dev \
  pixman-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for build)
RUN npm ci

# Copy application code
COPY . .

# Build Nuxt application
# This creates the .output directory with the Nitro server
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port 3000 (default Nuxt port)
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start Nuxt server
CMD ["node", ".output/server/index.mjs"]
