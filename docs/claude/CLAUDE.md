# Claude Code Configuration

## Project Overview

This is a **Nuxt 4 + TypeScript** web application for visualizing and analyzing mortality data across different countries and time periods.

### Key Technologies

- **Framework**: Nuxt 4 (Vue 3)
- **UI**: Nuxt UI v4 (alpha), PrimeVue
- **Charts**: Chart.js, vue-chartjs
- **Database**: SQLite (better-sqlite3)
- **Data Processing**: PapaParse (CSV), Zod validation
- **Styling**: Tailwind CSS (via Nuxt UI)

## Project Structure

```
app/
├── pages/           # Route pages (index, explorer, ranking, about, sources, donate)
├── components/      # Vue components
│   └── charts/      # Chart-related components (controls, visualizations)
├── composables/     # Vue composables
├── lib/             # Utility libraries
├── model/           # Data models
├── plugins/         # Nuxt plugins
├── data.ts          # Core data fetching and processing logic
├── model.ts         # TypeScript types and data models
├── chart.ts         # Chart.js configuration and utilities
├── colors.ts        # Color schemes and utilities
├── utils.ts         # General utilities
├── logoPlugin.ts    # Chart.js logo plugin
└── toast.ts         # Toast notification utilities
.data/               # SQLite database and data files (not in git)
public/              # Static assets
```

## Development Workflows

### Available Commands

- `npm run dev` - Start dev server (default: http://localhost:3000)
- `npm run build` - Production build
- `npm run generate` - Static site generation (prerender)
- `npm run preview` - Preview production build
- `npm run typecheck` - TypeScript type checking
- `npm run lint` - ESLint check
- `npm run lint:fix` / `npm run format` - Auto-fix linting issues

### Environment Variables

- `NUXT_PUBLIC_SITE_URL` - Public URL for OG images (see `.env.example`)

## Code Architecture

### Core Data Flow

1. **Data Source**: SQLite database in `.data/` directory
2. **Data Layer**: `app/data.ts` - Fetches and processes mortality data
3. **Models**: `app/model.ts` - TypeScript types (Country, MortalityData, etc.)
4. **Visualization**: `app/chart.ts` - Chart.js configurations
5. **Components**: `app/components/charts/` - Chart controls and rendering

### State Management Architecture (Refactored 2025-10-29)

The application uses a **composition-based state management** system with clear separation of concerns:

**`app/model/state.ts`** - Main State facade (622 lines, down from 756)

- Delegates to specialized classes for different responsibilities
- No ES6 Proxy complexity - explicit getters/setters
- Zero `as any` type casts - full type safety

**`app/model/state/` - Specialized State Classes:**

- **`StateData.ts`** - Core data properties (countries, dates, chart settings)
- **`StateComputed.ts`** - Computed values (chartStyle, colors, labels, indices)
- **`StateValidation.ts`** - Validation logic and data integrity checks
- **`StateEffects.ts`** - Side effect handlers (explicit, traceable)

**Benefits:**

- Each class has single responsibility and is independently testable
- Clear delegation pattern makes behavior explicit
- 184 dedicated unit tests for state classes
- Easier to maintain and extend

### Data Transformation Architecture

**Strategy Pattern** for chart data transformations (`app/lib/chart/datasets.ts`):

- **`PercentageTransformStrategy`** - Baseline percentage calculations
- **`CumulativeTransformStrategy`** - Cumulative sum transformations
- **`TotalTransformStrategy`** - Total sum aggregations
- **`DataTransformationPipeline`** - Orchestrates all strategies

Replaced 17-parameter functions with clean configuration objects and reduced cyclomatic complexity from 15-20 to 5-8.

### Key Files

- `app/data.ts` - Database queries, data transformations, aggregations
- `app/model.ts` - Type definitions for mortality data structures
- `app/model/state.ts` - Main state facade (delegates to state/ classes)
- `app/model/state/` - Specialized state management classes
- `app/chart.ts` - Chart configuration, plugins, rendering logic
- `app/lib/chart/datasets.ts` - Data transformation strategies
- `app/lib/chart/strategies/` - Individual transformation strategy classes
- `app/lib/cache/metadataCache.ts` - Metadata caching system (90%+ hit rate)
- `app/lib/config/constants.ts` - Centralized configuration constants
- `app/lib/errors/errorHandler.ts` - Unified error handling
- `app/colors.ts` - Color palette and theming for charts
- `app/utils.ts` - Helper functions (formatting, calculations)

### Chart Components

- `MortalityChartControlsPrimary.vue` - Main chart controls
- `MortalityChartControlsSecondary*.vue` - Various secondary control variants
  - `Simple` - Basic controls
  - `New` - Newer interface
  - `Custom` - Customizable options

### Key Composables (Refactored 2025-10-29)

**Chart Actions:**

- `useSaveChart()` - Reusable save chart modal & logic (used by explorer + ranking)
- `useExplorerChartActions()` - Explorer chart actions (copy link, screenshot, save)
- `useExplorerColors()` - Theme-aware color selection logic

**Data & State:**

- `useRankingData()` - Ranking table data processing
- `useChartDataFetcher()` - Chart data fetching and caching
- `useDataAvailability()` - Data availability validation

### Component Organization

**Explorer Page Components** (`app/components/explorer/`):

- `ExplorerSaveChartModal.vue` - Save chart modal UI
- Reduced explorer.vue from 573 → 426 lines (-25.7%)

**Ranking Page Components** (`app/components/ranking/`):

- `RankingHeader.vue` - Page title and description
- `RankingActions.vue` - Action buttons (explorer link, save)
- `RankingSaveModal.vue` - Save ranking modal UI
- Reduced ranking.vue from 570 → 483 lines (-15.3%)

### Pages

- `/` (index.vue) - Homepage
- `/explorer` (426 lines) - Data explorer interface (not prerendered)
- `/ranking` (483 lines) - Country rankings
- `/about` - About page
- `/sources` - Data sources
- `/donate` - Donation page
- `/test-*` - Testing pages (test-ranking, test-data, test-fetch)

## Styling & Linting

### ESLint Configuration

- Stylistic rules: comma-dangle: 'never', braceStyle: '1tbs'
- Run `npm run lint:fix` to auto-format code

### Code Conventions

- TypeScript strict mode enabled
- Vue 3 Composition API (script setup)
- Use Nuxt auto-imports (composables, components)

## Build & Deployment

### Prerendering

- Routes `/` is prerendered by default
- `/explorer` is excluded from prerender (dynamic content)
- SSR/SSG hybrid mode via `nuxt generate`

### Modules

- `@nuxt/ui` - UI component library
- `@nuxt/image` - Image optimization
- `@vueuse/nuxt` - Vue composition utilities
- `nuxt-og-image` - Dynamic OG image generation

## Database & Data

- **Database**: SQLite stored in `.data/` (gitignored)
- **Data Processing**: CSV parsing via PapaParse
- **Validation**: Zod schemas for data validation
- **Countries**: ISO country codes via `i18n-iso-countries`

## Recent Refactoring (2025-10-29)

### Overview

Completed comprehensive 10-phase refactoring to address technical debt and improve maintainability. All changes maintain 100% backward compatibility with zero breaking changes.

### Phases Completed

**Phase 0:** Extracted duplicated save chart logic into `useSaveChart()` composable (-200 lines duplication)

**Phase 1:** Centralized configuration constants in `app/lib/config/constants.ts` (eliminated magic numbers)

**Phase 2:** Implemented metadata caching system (`app/lib/cache/metadataCache.ts`) - 90%+ cache hit rate

**Phase 3:** Refactored datasets.ts using Strategy Pattern (17 params → config object, complexity 15-20 → 5-8)

**Phase 4a-c:** Broke up 756-line State god object into 4 focused classes:

- Removed ES6 Proxy complexity
- Eliminated all 6 `as any` type casts
- Added 184 dedicated unit tests
- State.ts: 756 → 622 lines (-17.7%)

**Phase 5a-b:** Reduced page sizes through component extraction:

- explorer.vue: 573 → 426 lines (-25.7%)
- ranking.vue: 570 → 483 lines (-15.3%)

**Phase 6:** Standardized error handling with `app/lib/errors/errorHandler.ts` (consistent UX, easier debugging)

**Phase 7:** Improved type safety across codebase (proper types, documented necessary casts)

### Impact Summary

**Code Quality:**

- Removed 200+ lines of duplicated code
- Reduced cyclomatic complexity (15-20 → 5-8)
- Zero `as any` type casts (was 6)
- No magic numbers (centralized in constants)

**Architecture:**

- Clear separation of concerns (State classes, Strategy pattern)
- Improved testability (184 new unit tests)
- Better error handling (centralized, consistent)
- Metadata caching (90%+ hit rate)

**Maintainability:**

- Smaller, focused files
- Reusable composables
- Comprehensive documentation
- Explicit over implicit (no Proxy magic)

**Testing:**

- 823+ unit tests (all passing)
- 160 E2E tests (all passing)
- 100% backward compatibility maintained

### Pull Requests

All 10 PRs (#31-41) merged successfully with full CI/E2E validation.

## Notes

- Using Nuxt 4 (latest) with compatibility date 2025-08-16
- Nuxt UI v4 is alpha - may have breaking changes
- Test pages (`/test-*`) are for development/debugging
- Data files and database are not committed to git
- Refactoring completed 2025-10-29 (10 phases, zero breaking changes)
