# Mortality Watch

[![CI](https://github.com/MortalityWatch/mortality.watch/actions/workflows/ci.yml/badge.svg)](https://github.com/MortalityWatch/mortality.watch/actions/workflows/ci.yml)

**Global mortality data visualization and analysis platform**

A Nuxt 4 web application for exploring and analyzing mortality data across 320+ countries and territories. Features interactive charts, real-time data visualization, and comprehensive mortality statistics from multiple international sources.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Download data for offline development (optional)
npm run download-data

# Start development server
npm run dev
```

Visit http://localhost:3000

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Development](#-development)
  - [Environment Variables](#environment-variables)
  - [Offline Development](#offline-development)
  - [Available Scripts](#available-scripts)
- [Testing](#-testing)
- [Social Login Setup (OAuth)](#-social-login-setup-oauth)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Data Visualization

- **Interactive Charts**: Line, bar, and matrix charts with Chart.js
- **Multiple Chart Types**: Weekly, monthly, quarterly, yearly data
- **Age Group Analysis**: All ages, 0-14, 15-64, 65-74, 75-84, 85+
- **Excess Mortality**: Calculate and visualize excess deaths
- **Baseline Methods**: Linear regression, mean, auto-detection
- **Moving Averages**: 13w, 26w, 52w, 104w smoothing

### Data Sources

- **320+ Countries**: Comprehensive global coverage
- **Multiple Sources**: UN, World Mortality Dataset, national statistics
- **Real-time Updates**: Data fetched from S3 CDN
- **Age-Standardized Rates**: ASMR calculations with standard populations

### Technical Features

- **Hybrid SSR**: Prerendered pages + SSR + client-only routes
- **Offline Development**: Work without internet after initial download
- **Server-side Chart Rendering**: Dynamic OG images for social sharing
- **Security**: OWASP-compliant headers, CSP, XSS protection
- **Accessibility**: WCAG 2.1 compliant, screen reader friendly
- **Performance**: Optimized builds, CDN-ready, caching strategies

---

## 🛠 Tech Stack

### Frontend

- **Nuxt 4** - Vue 3 meta-framework with hybrid rendering
- **Vue 3** - Composition API with script setup
- **TypeScript** - Strict mode enabled
- **Tailwind CSS** - Utility-first styling via Nuxt UI
- **Chart.js** - Interactive data visualization
- **PrimeVue** - Additional UI components

### Backend

- **Nitro** - Universal server engine
- **Node.js 22+** - Server runtime
- **SQLite** - Local database (better-sqlite3)
- **Canvas** - Server-side chart rendering

### Data

- **PapaParse** - CSV parsing
- **Zod** - Data validation
- **S3** - Data storage and CDN

### Development & Testing

- **Vitest** - Unit testing (376 tests)
- **Playwright** - E2E testing (32+ tests)
- **GitHub Actions** - CI/CD pipeline
- **ESLint** - Code linting with accessibility rules
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Lint-staged** - Pre-commit checks

---

## 📦 Installation

### Prerequisites

- **Node.js 22+** (LTS recommended)
- **npm 10+**

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

#### Windows

See [node-canvas documentation](https://github.com/Automattic/node-canvas#windows)

### Install Project Dependencies

```bash
npm install
```

---

## 💻 Development

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Public site URL (for OG images)
NUXT_PUBLIC_SITE_URL=https://www.mortality.watch

# Incognito mode (inverts colors)
NUXT_PUBLIC_INCOGNITO_MODE=0

# Use local cache only (offline mode)
NUXT_PUBLIC_USE_LOCAL_CACHE=true

# Development countries (subset for offline work)
NUXT_PUBLIC_DEV_COUNTRIES=USA,SWE,DEU

# Email (Resend)
EMAIL_HOST_PASSWORD=your_resend_api_key
EMAIL_FROM=Mortality Watch <noreply@mortality.watch>

# Error tracking (optional)
SENTRY_DSN=your_sentry_dsn

# Umami Analytics (optional)
NUXT_UMAMI_ID=your_website_id          # Get from Umami dashboard
NUXT_UMAMI_HOST=https://ua.e7ad.cc  # Your Umami instance URL

```

### Offline Development

Mortality Watch supports **true offline development** - work on planes, trains, or anywhere without internet!

#### Step 1: Choose Your Countries

Edit `.env`:

```bash
# Download only these countries
NUXT_PUBLIC_DEV_COUNTRIES=USA,SWE,DEU

# Enable offline mode
NUXT_PUBLIC_USE_LOCAL_CACHE=true
```

#### Step 2: Download Data

```bash
# Download just your dev countries (fast)
npm run download-data

# Or download all 320+ countries (slow, ~15min)
npm run download-data -- --all
```

#### Step 3: Work Offline

```bash
npm run dev
```

Now:

- ✅ Zero internet requests
- ✅ All data served from local cache
- ✅ Fast development iteration
- ✅ Helpful errors if you try unavailable countries

### Development Modes

| Mode                          | Command                          | Countries   | Internet          |
| ----------------------------- | -------------------------------- | ----------- | ----------------- |
| **Offline Dev** (recommended) | `npm run dev`                    | From `.env` | ❌ Not needed     |
| **Default**                   | Remove env var                   | 18 defaults | ✅ Fallback to S3 |
| **Custom Subset**             | Set `NUXT_PUBLIC_DEV_COUNTRIES`  | Your choice | ✅ Fallback to S3 |
| **All Countries**             | `npm run download-data -- --all` | 320+        | ✅ Required once  |

### Available Scripts

#### Development

```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run generate         # Static site generation
npm run preview          # Preview production build
```

#### Data Management

```bash
npm run download-data              # Download dev countries from .env
npm run download-data -- --all     # Download all 320+ countries
NUXT_PUBLIC_DEV_COUNTRIES=USA,GBR npm run download-data  # Custom subset
```

#### Code Quality

```bash
npm run lint             # Check linting
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format code with Prettier
npm run typecheck        # TypeScript type checking
npm run check            # Run all checks (lint + typecheck + test)
```

#### Testing

```bash
npm run test             # Run unit tests
npm run test:ui          # Test UI with Vitest
npm run test:coverage    # Test coverage report
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # E2E test UI (interactive)
npm run test:e2e:debug   # Debug E2E tests
npm run test:e2e:report  # View E2E test report
```

### Development Server

```bash
npm run dev
```

Features:

- **Hot Module Replacement** - Instant updates
- **TypeScript** - Full type checking
- **Server Routes** - `/api/data/*`, `/chart.png`, `/api/health`
- **Local Data Cache** - Offline-first development

Pages:

- `/` - Homepage (prerendered)
- `/explorer` - Interactive data explorer (client-only)
- `/ranking` - Country rankings (SSR)
- `/about` - About page (prerendered)
- `/sources` - Data sources (prerendered)
- `/donate` - Donation page (prerendered)

---

## 🧪 Testing

### Unit Tests (Vitest)

```bash
npm test                 # Run all unit tests
npm run test:ui          # Interactive test UI
npm run test:coverage    # Coverage report
```

**376 unit tests passing** ✅

Coverage includes:

- Data loading and processing
- Chart state management
- Data validation
- URL state encoding/decoding
- Mortality calculations
- Utility functions
- Composables

### E2E Tests (Playwright)

```bash
npm run test:e2e         # Run E2E tests (chromium)
npm run test:e2e:ui      # Interactive E2E test UI
npm run test:e2e:debug   # Debug E2E tests
npm run test:e2e:report  # View test report
```

**32+ E2E tests passing** ✅

Test coverage:

- Homepage and navigation
- Explorer page interactions
- Ranking page functionality
- Chart rendering and controls
- Responsive layout
- URL state persistence

E2E tests run on:

- **Chromium** (CI and local)
- **Firefox** (local only)
- **WebKit/Safari** (local only)
- **Mobile viewports** (Chrome & Safari)

### CI/CD Pipeline

Every push triggers automated checks:

1. **Lint & Format** - ESLint with auto-fix
2. **Type Check** - TypeScript strict mode
3. **Unit Tests** - 376 Vitest tests
4. **Build Verification** - Production build check
5. **E2E Tests** - Playwright on Chromium

All checks must pass before merge. View CI status: [![CI](https://github.com/MortalityWatch/mortality.watch/actions/workflows/ci.yml/badge.svg)](https://github.com/MortalityWatch/mortality.watch/actions/workflows/ci.yml)

### Pre-commit Checks

Git hooks automatically run on commit:

- ESLint (auto-fix enabled)
- Prettier (auto-format)
- TypeScript type checking

Powered by **husky** + **lint-staged**.

---

## 🔐 Social Login Setup (OAuth)

Mortality Watch supports social login with **X (Twitter)** and **Google**. Social login buttons only appear when the corresponding OAuth credentials are configured.

### X (Twitter) OAuth Setup

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or use an existing one
3. Go to **User authentication settings** and enable **OAuth 2.0**
4. Set the following:
   - **Type of App**: Web App
   - **Callback URL**: `https://your-domain.com/auth/twitter`
   - **Website URL**: `https://your-domain.com`
5. Copy your **Client ID** and **Client Secret**

Add to `.env`:

```bash
NUXT_OAUTH_X_CLIENT_ID=your_client_id
NUXT_OAUTH_X_CLIENT_SECRET=your_client_secret
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select an existing one
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Select **Web application**
6. Add to **Authorized redirect URIs**: `https://your-domain.com/auth/google`
7. Copy your **Client ID** and **Client Secret**

Add to `.env`:

```bash
NUXT_OAUTH_GOOGLE_CLIENT_ID=your_client_id
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=your_client_secret
```

### Session Encryption

Social login session encryption automatically reuses your existing `JWT_SECRET` - no additional configuration needed.

### Local Development

For local development, use `http://localhost:3000` as your redirect URI:

- **X callback**: `http://localhost:3000/auth/twitter`
- **Google callback**: `http://localhost:3000/auth/google`

### Behavior

- If OAuth credentials are not set, the social login buttons are **automatically hidden**
- Users can sign up/login with social providers, which:
  - Creates a new account if the email doesn't exist
  - Links to an existing account if the email matches
  - Automatically marks email as verified (social providers verify emails)

---

## 🚢 Deployment

### Docker (Recommended)

```bash
# Build
docker build -t mortality-watch .

# Run
docker run -p 3000:3000 \
  -e NUXT_PUBLIC_SITE_URL=https://www.mortality.watch \
  mortality-watch
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete Docker, Dokku, and Node.js deployment guides.

### Dokku

```bash
# Add Dokku remote
git remote add dokku dokku@your-server.com:mortality-watch

# Deploy
git push dokku master
```

### Node.js Server

```bash
# Build
npm run build

# Run
NODE_ENV=production node .output/server/index.mjs
```

### Vercel/Netlify (Static)

```bash
# Generate static site
npm run generate

# Deploy .output/public directory
```

**Note**: Server routes (`/chart.png`, `/api/*`) won't work with static deployment.

---

## 📂 Project Structure

```
.
├── app/                          # Application code
│   ├── components/              # Vue components
│   │   └── charts/              # Chart components
│   ├── composables/             # Vue composables
│   ├── lib/                     # Utility libraries
│   │   ├── chartState.ts        # Chart state encoding/decoding
│   │   ├── dataLoader.ts        # Data loading abstraction
│   │   └── mortality/           # Mortality-specific utilities
│   ├── pages/                   # Route pages
│   ├── data.ts                  # Core data fetching logic
│   ├── model.ts                 # TypeScript types
│   └── chart.ts                 # Chart.js configuration
│
├── server/                       # Server-side code
│   ├── api/                     # API routes
│   │   ├── data/[...path].ts   # Data proxy with local cache
│   │   └── health.ts           # Health check endpoint
│   ├── routes/                  # Custom server routes
│   │   └── chart.png.ts        # Server-side chart rendering
│   └── utils/                   # Server utilities
│       └── chartRenderer.ts    # Chart.js server setup
│
├── scripts/                      # Build and utility scripts
│   └── download-data.ts         # Data download script
│
├── .data/                        # Local data cache (git-ignored)
│   └── cache/
│       └── mortality/           # Downloaded CSV files
│
├── public/                       # Static assets
├── tests/                        # Test files (co-located with source)
│
├── nuxt.config.ts               # Nuxt configuration
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── eslint.config.mjs            # ESLint configuration
│
├── Dockerfile                   # Docker container
├── .dockerignore                # Docker build optimization
│
├── README.md                    # This file
├── DEPLOYMENT.md                # Deployment guide
└── ACCESSIBILITY.md             # Accessibility documentation
```

---

## 📚 Documentation

### Comprehensive Guides

- **[README.md](./README.md)** - This file (overview and getting started)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment options (Docker, Dokku, Node.js)
- **[ACCESSIBILITY.md](./ACCESSIBILITY.md)** - Accessibility guidelines and testing

### Architecture

- **Hybrid SSR**: Prerendered pages for SEO, SSR for fresh data, client-only for interactivity
- **Data Layer**: Environment-aware data loading (local cache in dev, S3 in production)
- **Server Routes**: Chart rendering, data proxy, health checks
- **Security**: OWASP headers, CSP, XSS protection
- **Accessibility**: WCAG 2.1 compliance, screen reader support

### Key Concepts

#### Rendering Modes

- **Prerendered**: `/`, `/about`, `/sources`, `/donate` (static HTML at build time)
- **Server-Side Rendered**: `/ranking` (fresh data on each request)
- **Client-Only**: `/explorer` (interactive, no SSR)

#### Data Flow

1. **Development**: Client → `/api/data/*` → Local cache or S3 fallback
2. **Production**: Client → `/api/data/*` → S3
3. **Server**: Direct S3 fetch (no self-requests)

#### Chart Rendering

- **Client-side**: Interactive charts in browser
- **Server-side**: PNG generation for Open Graph images (`/chart.png`)
- **State**: Encoded in URL query parameters

---

## 🤝 Contributing

### Development Workflow

1. **Fork and clone**

   ```bash
   git clone https://github.com/your-username/mortality-watch.git
   cd mortality-watch
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Download test data**

   ```bash
   # Quick start with 3 countries
   echo "NUXT_PUBLIC_DEV_COUNTRIES=USA,GBR,DEU" >> .env
   echo "NUXT_PUBLIC_USE_LOCAL_CACHE=true" >> .env
   npm run download-data
   ```

4. **Create a branch**

   ```bash
   git checkout -b feature/your-feature
   ```

5. **Make changes**
   - Write code
   - Add tests
   - Run `npm run check`

6. **Commit**

   ```bash
   git commit -m "feat: add awesome feature"
   ```

   Pre-commit hooks will automatically:
   - Lint and fix code
   - Format with Prettier
   - Run type checks

7. **Push and create PR**
   ```bash
   git push origin feature/your-feature
   ```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring
- `test:` - Test changes
- `perf:` - Performance improvements

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: No errors allowed
- **Prettier**: Auto-formatted on commit
- **Tests**: Add tests for new features
- **Accessibility**: Follow WCAG 2.1 AA guidelines

---

## 📄 License

[Add your license here]

---

## 🙏 Acknowledgments

### Data Sources

- **UN World Population Prospects** - Historical mortality data
- **World Mortality Dataset** - Recent mortality statistics
- **National Statistics Offices** - Country-specific data

### Technologies

- Built with [Nuxt](https://nuxt.com/)
- Charts powered by [Chart.js](https://www.chartjs.org/)
- UI components from [Nuxt UI](https://ui.nuxt.com/)
- Deployed on [Your hosting platform]

---

## 📧 Contact

- **Website**: https://www.mortality.watch
- **GitHub**: https://github.com/MortalityWatch/mortality-watch
- **Issues**: https://github.com/MortalityWatch/mortality-watch/issues

---

## 🗺️ Roadmap

### Planned Features

- [ ] Additional chart types (scatter, radar)
- [x] Export data as CSV/JSON
- [ ] Comparison mode (multiple countries side-by-side)
- [ ] Embed charts on external sites
- [ ] Mobile app (Progressive Web App)
- [ ] API for programmatic access
- [x] User accounts and saved configurations

### Infrastructure

- [ ] Redis caching for chart images
- [x] CDN integration for global distribution (S3)
- [ ] Automated data updates from sources
- [x] CI/CD pipeline (GitHub Actions)
- [ ] Error tracking (Sentry)
- [x] Analytics (Umami - privacy-first)

---

**Built with ❤️ by the Mortality Watch team**

_Last updated: 2026-01-02_
