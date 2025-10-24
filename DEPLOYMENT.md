# Deployment Guide

## Overview

This application is a Nuxt 4 SSR application with server-side chart rendering capabilities. It can be deployed in multiple ways depending on your infrastructure.

## Architecture

- **Framework**: Nuxt 4 with Nitro server
- **Rendering**: Hybrid SSR (prerendered pages + SSR + client-only routes)
- **Server Routes**:
  - `/api/data/*` - Data proxy (S3 in production, local cache in dev)
  - `/chart.png` - Server-side chart rendering (requires canvas)
  - `/api/health` - Health check endpoint
- **Static Assets**: Served from `public/` directory

## Prerequisites

### Node.js Dependencies

- Node.js 22+ (LTS recommended)
- npm 10+

### Canvas Dependencies (for server-side chart rendering)

#### macOS

```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman
```

#### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  libpixman-1-dev
```

#### Alpine Linux (Docker)

```dockerfile
RUN apk add --no-cache \
  build-base \
  cairo-dev \
  pango-dev \
  jpeg-dev \
  giflib-dev \
  librsvg-dev \
  pixman-dev
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Public site URL (for OG images)
NUXT_PUBLIC_SITE_URL=https://www.mortality.watch

# Enable local data cache in development
NUXT_PUBLIC_USE_LOCAL_CACHE=false

# Incognito mode (hides analytics)
NUXT_PUBLIC_INCOGNITO_MODE=0
```

## Development

### Setup

```bash
# Install dependencies
npm install

# Download data for offline development (optional)
npm run download-data

# Start dev server
npm run dev
```

### Development Server

- URL: http://localhost:3000
- Hot Module Replacement (HMR) enabled
- Server routes available
- Local data caching (if downloaded)

## Production Deployment

### Option 1: Docker (Recommended for Dokku/Kubernetes)

#### Build Image

```bash
docker build -t mortality-watch .
```

#### Run Container

```bash
docker run -p 3000:3000 \
  -e NUXT_PUBLIC_SITE_URL=https://www.mortality.watch \
  mortality-watch
```

#### With Docker Compose

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NUXT_PUBLIC_SITE_URL=https://www.mortality.watch
      - NODE_ENV=production
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))",
        ]
      interval: 30s
      timeout: 3s
      retries: 3
    restart: unless-stopped
```

### Option 2: Dokku Deployment

#### Setup Dokku App

```bash
# On Dokku server
dokku apps:create mortality-watch
dokku config:set mortality-watch \
  NUXT_PUBLIC_SITE_URL=https://www.mortality.watch \
  NODE_ENV=production

# Configure buildpack (auto-detected from Dockerfile)
dokku builder:set mortality-watch build-dir .
```

#### Deploy from Git

```bash
# Add Dokku remote
git remote add dokku dokku@your-server.com:mortality-watch

# Deploy
git push dokku master
```

#### Configure Domain

```bash
dokku domains:add mortality-watch www.mortality.watch
dokku letsencrypt:enable mortality-watch  # Enable HTTPS
```

### Option 3: Node.js Server

#### Build Application

```bash
npm run build
```

This creates a `.output/` directory with:

- `server/index.mjs` - Nitro server
- `public/` - Static assets

#### Run Server

```bash
# Production mode
NODE_ENV=production node .output/server/index.mjs

# With PM2
pm2 start .output/server/index.mjs --name mortality-watch
pm2 save
```

#### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name www.mortality.watch;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location /_nuxt/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Option 4: Vercel/Netlify (Static Generation)

**Note**: Server routes (`/chart.png`, `/api/*`) will not work with static deployment. Use serverless functions or Docker deployment instead.

```bash
# Generate static site
npm run generate

# Deploy .output/public directory
```

## Rendering Modes

### Prerendered Pages (Build Time)

- `/` - Homepage
- `/about` - About page
- `/sources` - Data sources
- `/donate` - Donation page

These pages are generated at build time and served as static HTML.

### Server-Side Rendered (Runtime)

- `/ranking` - Rankings page (fresh data on each request)

### Client-Side Only

- `/explorer` - Interactive data explorer

## Server Routes

### Data API (`/api/data/*`)

Proxies data from S3 (production) or local cache (development).

**Examples**:

```
GET /api/data/world_meta.csv
GET /api/data/USA/weekly.csv
GET /api/data/GBR/monthly_65-74.csv
```

### Chart Renderer (`/chart.png`)

Generates PNG charts for Open Graph images.

**Parameters**:

- `countries` - Comma-separated country codes (e.g., `USA,GBR`)
- `chartType` - Chart type (`weekly`, `monthly`, `yearly`, etc.)
- `type` - Data type (`deaths`, `asmr`, `le`, etc.)
- `isExcess` - Boolean flag for excess data
- `ageGroups` - Comma-separated age groups
- `chartStyle` - Chart style (`line`, `bar`, `matrix`)
- `width` - Image width (default: 1200)
- `height` - Image height (default: 630)

**Example**:

```
GET /chart.png?countries=USA&chartType=weekly&type=deaths&width=1200&height=630
```

Returns: PNG image (image/png)

### Health Check (`/api/health`)

Returns server health status (for Docker/Kubernetes).

**Example**:

```
GET /api/health
```

Returns:

```json
{
  "status": "ok",
  "timestamp": "2025-10-05T14:00:00.000Z"
}
```

## Performance Optimization

### Caching Strategy

#### Browser Caching

Security headers configured in `nuxt.config.ts` include:

- Static assets cached with immutable headers
- API responses cached per configuration

#### CDN Caching

Recommended CloudFlare settings:

- Cache Level: Standard
- Browser Cache TTL: Respect Existing Headers
- Cache by Device Type: Off
- Edge Cache TTL: 4 hours for `/chart.png`, 1 hour for pages

### Server-Side Chart Caching

Chart images are generated on-demand. Consider:

- Caching rendered images in Redis/S3
- Using CDN to cache chart images
- Implementing stale-while-revalidate

## Monitoring

### Health Checks

```bash
curl http://localhost:3000/api/health
```

### Docker Health Check

Automatically configured in Dockerfile:

- Interval: 30s
- Timeout: 3s
- Start period: 40s

### Logging

Application logs to stdout. Use your platform's logging solution:

- Docker: `docker logs <container_id>`
- Dokku: `dokku logs mortality-watch`
- PM2: `pm2 logs mortality-watch`

## Troubleshooting

### Canvas Errors in Production

**Error**: `Error: Cannot find module 'canvas'`

**Solution**: Ensure canvas dependencies are installed (see Prerequisites)

### Out of Memory Errors

**Error**: `JavaScript heap out of memory`

**Solution**: Increase Node.js memory limit

```bash
NODE_OPTIONS="--max-old-space-size=4096" node .output/server/index.mjs
```

### Chart Rendering Fails

**Error**: Chart images return 500 errors

**Checklist**:

1. Verify canvas dependencies are installed
2. Check `/api/health` endpoint works
3. Test data API endpoints (e.g., `/api/data/world_meta.csv`)
4. Review server logs for errors

### CORS Issues

If accessing from different domain:

**Solution**: Add CORS headers in `nuxt.config.ts`:

```typescript
nitro: {
  routeRules: {
    '/api/**': {
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    }
  }
}
```

## Security Considerations

### Implemented Security Headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (camera, microphone, geolocation disabled)
- `Content-Security-Policy` (strict resource loading)

### Additional Recommendations

1. **Use HTTPS**: Always deploy with SSL/TLS
2. **Rate Limiting**: Implement rate limiting for `/chart.png`
3. **Input Validation**: Query parameters are validated
4. **Dependency Updates**: Run `npm audit` regularly
5. **Environment Variables**: Never commit secrets to git

## Scaling

### Horizontal Scaling

The application is stateless and can be scaled horizontally:

- Docker Swarm
- Kubernetes
- Multiple Dokku instances with load balancer

### Caching Layer

Add Redis for chart caching:

1. Generate chart once
2. Cache PNG in Redis (key: query params hash)
3. TTL: 1 hour
4. Reduce server load by 90%+

### CDN Integration

Use CloudFlare or similar CDN:

- Cache `/chart.png` responses
- Reduce origin server load
- Improve global latency

## Backup & Disaster Recovery

### Data Backup

Data is fetched from S3 (https://s3.mortality.watch). No local database to backup.

### Application Backup

1. Git repository (source code)
2. Environment variables (encrypted)
3. Docker images (container registry)

### Recovery Process

1. Pull latest code from git
2. Restore environment variables
3. Deploy via Docker/Dokku
4. Verify health check passes

## Support & Resources

- **Documentation**: `/PLAN.md`, `/ACCESSIBILITY.md`
- **Health Check**: `/api/health`
- **GitHub**: (add your repo URL)
- **Issues**: Report bugs via GitHub Issues

---

**Last Updated**: 2025-10-05
