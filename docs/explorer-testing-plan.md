# Explorer View Testing Plan

## Overview

This document provides a comprehensive analysis of the `/explorer` view UI options, their combinations, current test coverage, and a plan for visual parity testing between client and SSR rendered charts.

---

## Section 1: UI Features & Combinations

### 1.1 Core Dimensions

| Dimension | Values | Count |
|-----------|--------|-------|
| **View Mode** | `mortality`, `excess`, `zscore` | 3 |
| **Chart Style** | `line`, `bar`, `matrix` | 3 |
| **Metric Type** | `asmr`, `cmr`, `le`, `deaths`, `population` | 5 |

### 1.2 Data Selection Options

| Option | URL Param | Values | Dependencies |
|--------|-----------|--------|--------------|
| Metric Type | `t` | `le`, `asmr`, `cmr`, `deaths`, `population` | ASMR requires `sp`; ASMR/LE force `ageGroups=['all']` |
| Analysis Mode | `e`, `zs` | mortality (default), excess (`e=1`), zscore (`zs=1`) | Z-Score requires Pro tier |
| Period | `ct` | `weekly`, `monthly`, `quarterly`, `yearly`, `midyear`, `fluseason`, `weekly_*_sma` | None |
| Standard Population | `sp` | `esp`, `who`, `usa`, `country` | Only visible when `type=asmr` |
| Countries | `c` | Multi-select (1-10) | Some disabled for ASMR/LE |
| Age Groups | `ag` | Multi-select | ASMR/LE force `['all']` only |
| Date Range | `df`, `dt` | Date strings | Format depends on `ct` |
| Slider Start | `ss` | Date string | None |

### 1.3 Baseline Options

| Option | URL Param | Values | Dependencies |
|--------|-----------|--------|--------------|
| Show Baseline | `sb` | `0`, `1` | Forced ON in excess/zscore views |
| Baseline Method | `bm` | `naive`, `mean`, `median`, `lin_reg`, `exp` | Advanced methods require registered tier |
| Baseline Period | `bf`, `bt` | Date strings | None |

### 1.4 Display Options by View

| Option | URL Param | Mortality | Excess | Z-Score |
|--------|-----------|-----------|--------|---------|
| Show Baseline | `sb` | toggle | forced ON | hidden (required) |
| Prediction Interval | `pi` | conditional (needs baseline) | toggle | toggle |
| Log Scale | `lg` | toggle | hidden | hidden |
| Maximize | `m` | toggle | conditional (bar only) | conditional (bar only) |
| Cumulative | `ce` | hidden | toggle | hidden |
| Percentage | `p` | hidden | toggle | hidden |
| Show Total | `st` | hidden | conditional (cumulative+bar) | hidden |

### 1.5 Style Options

| Option | URL Param | Values | Dependencies |
|--------|-----------|--------|--------------|
| Chart Style | `cs` | `line`, `bar`, `matrix` | Matrix disables baseline/PI/log/maximize |
| Show Labels | `sl` | `0`, `1` | None (independent) |
| Number Precision | `dec` | `auto`, `0`, `1`, `2`, `3` | Pro feature |
| Show Caption | `cap` | `0`, `1` | Pro feature |
| Show Logo | `lo` | `0`, `1` | Pro feature |
| Show QR Code | `qr` | `0`, `1` | Pro feature |
| Custom Colors | - | Hex values | Registered feature |

### 1.6 Constraint Rules

| Constraint | Trigger | Effect | Priority |
|------------|---------|--------|----------|
| Baseline OFF | `showBaseline=false` | `showPredictionInterval=false` | 1 |
| Population type | `type=population` | Disables baseline, PI, view modes | 2 |
| ASMR/LE type | `type=asmr` or `type=le` | Forces `ageGroups=['all']` | 2 |
| Matrix style | `chartStyle=matrix` | Disables baseline, PI, maximize, log | 2 |
| Cumulative OFF | `cumulative=false` | `showTotal=false` | 1 |
| Excess view | `view=excess` | Forces `showBaseline=true`, disables log | 2 |
| Z-Score view | `view=zscore` | Forces `showBaseline=true`, disables log/cumulative/percentage | 2 |

### 1.7 Valid Combination Matrix

#### View × Chart Style

| ID | View | Chart Style | Valid | Notes |
|----|------|-------------|-------|-------|
| M-L | mortality | line | Yes | Default combination |
| M-B | mortality | bar | Yes | |
| M-X | mortality | matrix | Yes | Baseline/PI/log/maximize disabled |
| E-L | excess | line | Yes | Baseline forced ON |
| E-B | excess | bar | Yes | Default for excess view |
| E-X | excess | matrix | Yes | Baseline forced, PI disabled |
| Z-L | zscore | line | Yes | Default for zscore view |
| Z-B | zscore | bar | Yes | |
| Z-X | zscore | matrix | **No** | Z-Score incompatible with matrix |

#### View × Metric Compatibility

| View | Compatible Metrics | Excluded Metrics |
|------|-------------------|------------------|
| mortality | cmr, asmr, le, deaths, population* | *population has special handling |
| excess | cmr, asmr, deaths | le, population |
| zscore | cmr, asmr, deaths | le, population |

### 1.8 Complete Combination List

| # | ID | View | Style | Metrics | Key Behaviors |
|---|-----|------|-------|---------|---------------|
| 1 | M-L-std | mortality | line | asmr, cmr, deaths | Full feature set |
| 2 | M-L-le | mortality | line | le | ageGroups forced to ['all'] |
| 3 | M-L-pop | mortality | line | population | Baseline/PI disabled |
| 4 | M-B-std | mortality | bar | asmr, cmr, deaths | Full feature set |
| 5 | M-B-le | mortality | bar | le | ageGroups forced to ['all'] |
| 6 | M-B-pop | mortality | bar | population | Baseline/PI disabled |
| 7 | M-X-std | mortality | matrix | asmr, cmr, deaths | Baseline/PI/log/maximize disabled |
| 8 | M-X-le | mortality | matrix | le | ageGroups=['all'], baseline/PI disabled |
| 9 | M-X-pop | mortality | matrix | population | Most restricted |
| 10 | E-L-std | excess | line | asmr, cmr, deaths | Baseline forced, percentage/cumulative available |
| 11 | E-B-std | excess | bar | asmr, cmr, deaths | Default excess; showTotal available |
| 12 | E-X-std | excess | matrix | asmr, cmr, deaths | Baseline forced, PI/maximize disabled |
| 13 | Z-L-std | zscore | line | asmr, cmr, deaths | Baseline hidden but required |
| 14 | Z-B-std | zscore | bar | asmr, cmr, deaths | Baseline hidden, maximize available |

### 1.9 Independent Options (No Side Effects)

These options work identically across all combinations and only need testing once:

- **Show Labels** (`sl`) - Toggles data labels on chart
- **Show Logo** (`lo`) - Toggles watermark (Pro only)
- **Show QR Code** (`qr`) - Toggles QR code (Pro only)
- **Show Caption** (`cap`) - Toggles caption (Pro only)
- **Number Precision** (`dec`) - Decimal places (Pro only)
- **Custom Colors** - Color scheme (Registered+)
- **Chart Size Preset** - Chart dimensions (Pro only)

---

## Section 2: Testing Coverage

### 2.1 Unit Tests (Vitest)

#### State & Schema Tests

| File | Purpose | Coverage |
|------|---------|----------|
| `app/lib/state/resolver/StateResolver.test.ts` | Constraint application, view defaults, user overrides | Good |
| `app/model/explorerSchema.test.ts` | Zod validation, date formats, enum validation | Good |
| `app/composables/useExplorerState.test.ts` | State management | Partial |
| `app/composables/useExplorerDataOrchestration.test.ts` | Data loading orchestration | Partial |

#### Chart Tests

| File | Purpose | Coverage |
|------|---------|----------|
| `app/lib/chart/chartConfig.test.ts` | Chart configuration generation | Partial |
| `app/lib/chart/chartConfigHelpers.test.ts` | Config helper functions | Partial |
| `app/lib/chart/chartUtils.test.ts` | Chart utilities | Partial |
| `app/lib/chart/datasets.test.ts` | Dataset transformations | Partial |
| `app/lib/chart/filtering.test.ts` | Data filtering | Partial |
| `app/lib/chart/labelVisibility.test.ts` | Label display logic | Partial |
| `app/lib/chart/labels.test.ts` | Label formatting | Partial |
| `app/lib/chart/strategies/CumulativeTransformStrategy.test.ts` | Cumulative transform | Good |
| `app/lib/chart/strategies/TotalTransformStrategy.test.ts` | Total transform | Good |

#### Server Tests

| File | Purpose | Coverage |
|------|---------|----------|
| `server/utils/chartRenderer.test.ts` | SSR chart rendering | Partial |

### 2.2 E2E Tests (Playwright)

#### Test Files

| File | Tests | Combinations Covered |
|------|-------|---------------------|
| `tests/e2e/explorer.spec.ts` | 15 | M-L, E-*, Z-* basics |
| `tests/e2e/explorer-views.spec.ts` | 26 | View modes, mutual exclusivity |
| `tests/e2e/explorer-style.spec.ts` | 18 | Chart styles, labels |
| `tests/e2e/explorer-baseline.spec.ts` | 18 | Baseline methods, constraints |
| `tests/e2e/explorer-toggles.spec.ts` | 14 | URL state restoration |
| `tests/e2e/explorer-data-selection.spec.ts` | 18 | Metrics, chart types, countries |
| `tests/e2e/chart-interactions.spec.ts` | 5 | Basic chart rendering |

### 2.3 Coverage Matrix by Combination

| # | ID | E2E Load | E2E Constraints | E2E UI Controls | Unit Constraints |
|---|-----|----------|-----------------|-----------------|------------------|
| 1 | M-L-std | ✅ | ✅ | ✅ | ✅ |
| 2 | M-L-le | ✅ | ❌ | ❌ | ✅ |
| 3 | M-L-pop | ✅ | ❌ | ❌ | ✅ |
| 4 | M-B-std | ✅ | ❌ | ✅ | ❌ |
| 5 | M-B-le | ❌ | ❌ | ❌ | ❌ |
| 6 | M-B-pop | ❌ | ❌ | ❌ | ❌ |
| 7 | M-X-std | ✅ | ❌ | ❌ | ✅ |
| 8 | M-X-le | ❌ | ❌ | ❌ | ❌ |
| 9 | M-X-pop | ❌ | ❌ | ❌ | ❌ |
| 10 | E-L-std | ✅ | ✅ | ✅ | ✅ |
| 11 | E-B-std | ✅ | ✅ | ✅ | ✅ |
| 12 | E-X-std | ❌ | ❌ | ❌ | ❌ |
| 13 | Z-L-std | ✅ | ✅ | ✅ | ✅ |
| 14 | Z-B-std | ❌ | ❌ | ❌ | ❌ |

### 2.4 Coverage Gaps

#### Missing E2E Tests

- **Combinations 5, 6, 8, 9**: Mortality + bar/matrix with le/population metrics
- **Combination 12**: Excess + matrix
- **Combination 14**: Z-score + bar

#### Missing Constraint E2E Tests

- Matrix style disabling features
- Population type disabling baseline
- LE/ASMR forcing ageGroups=['all']
- ShowTotal conditional on cumulative+bar

#### Missing Unit Tests

- View configuration resolution
- UI visibility computation
- Chart style constraints

### 2.5 Recommended Test Additions

#### Unit Tests

```typescript
// app/lib/state/config/views.test.ts
describe('View Configurations', () => {
  it('mortality view allows all display options')
  it('excess view forces baseline ON')
  it('zscore view hides cumulative/percentage')
  it('matrix style is incompatible with zscore')
})

// app/lib/state/config/constraints.test.ts
describe('State Constraints', () => {
  it('population type disables baseline and PI')
  it('ASMR/LE types force ageGroups to all')
  it('matrix style disables multiple options')
  it('cumulative OFF disables showTotal')
})
```

#### E2E Tests

```typescript
// tests/e2e/explorer-combinations.spec.ts
describe('All Valid Combinations', () => {
  // Test each of 14 combinations loads and renders
  for (const combo of COMBINATIONS) {
    test(`${combo.id} loads and renders correctly`)
  }
})

// tests/e2e/explorer-constraints.spec.ts
describe('Constraint Enforcement', () => {
  test('matrix style disables baseline toggle')
  test('population metric disables view modes')
  test('ASMR forces all age group')
})
```

---

## Section 3: Client/SSR Chart Comparison

### 3.1 Current Architecture

| Aspect | Client | SSR |
|--------|--------|-----|
| Technology | `vue-chartjs` + browser Canvas | `node-canvas` (Cairo) + Chart.js |
| Entry Point | `MortalityChart.vue` | `/server/routes/chart.png.ts` |
| Config Source | `makeChartConfig()` | `makeChartConfig()` (shared) |
| Animation | Enabled | Disabled |
| Device Pixel Ratio | Auto | 2 |
| Output | DOM Canvas | PNG Buffer |

### 3.2 Shared Configuration

Both client and SSR use the same configuration pipeline:

```
URL Parameters
     ↓
State Resolution (resolveChartStateForRendering)
     ↓
Data Loading (DataLoaderService)
     ↓
Data Transformation (getFilteredChartData)
     ↓
Chart Config (makeChartConfig)
     ↓
Rendering (browser canvas / node-canvas)
```

### 3.3 Known Differences

| Aspect | Impact | Mitigation |
|--------|--------|------------|
| Font rendering | Cairo vs browser text | Use pixel threshold |
| Anti-aliasing | Subpixel algorithms differ | Allow 1% tolerance |
| Line smoothing | Bezier interpolation | Visual inspection |
| Animation state | Client may capture mid-animation | Wait for animation end |

### 3.4 Visual Parity Test Implementation

#### Test Structure

```typescript
// tests/e2e/chart-visual-parity.spec.ts
import { test, expect } from '@playwright/test'

const COMBINATIONS = [
  { id: 'M-L-std', params: '', desc: 'Mortality line default' },
  { id: 'M-B-std', params: 'cs=bar', desc: 'Mortality bar' },
  { id: 'M-X-std', params: 'cs=matrix', desc: 'Mortality matrix' },
  { id: 'E-B-std', params: 'e=1', desc: 'Excess bar default' },
  { id: 'E-L-std', params: 'e=1&cs=line', desc: 'Excess line' },
  { id: 'Z-L-std', params: 'zs=1', desc: 'Z-score line default' },
  { id: 'Z-B-std', params: 'zs=1&cs=bar', desc: 'Z-score bar' },
]

const THEMES = ['light', 'dark']

test.describe('SSR vs Client Chart Parity', () => {
  for (const combo of COMBINATIONS) {
    for (const theme of THEMES) {
      test(`${combo.id} (${theme}): SSR matches client`, async ({ page, request }) => {
        const dmParam = theme === 'dark' ? '&dm=1' : ''
        const fullParams = combo.params + dmParam

        // 1. Fetch SSR-rendered PNG
        const ssrResponse = await request.get(`/chart.png?${fullParams}`)
        expect(ssrResponse.ok()).toBeTruthy()

        // 2. Load client page
        await page.goto(`/explorer?${fullParams}`)
        await page.waitForSelector('canvas#chart', { timeout: 15000 })
        await page.waitForTimeout(1000) // Wait for animations

        // 3. Screenshot client canvas
        const canvas = page.locator('canvas#chart')
        const clientScreenshot = await canvas.screenshot()

        // 4. Visual comparison with tolerance
        expect(clientScreenshot).toMatchSnapshot(
          `chart-${combo.id}-${theme}-client.png`,
          { maxDiffPixelRatio: 0.02 }
        )
      })
    }
  }
})
```

#### Baseline Snapshot Generation

```bash
# Generate baseline snapshots
npx playwright test chart-visual-parity --update-snapshots
```

### 3.5 Pixel-Level Comparison (Alternative)

For stricter comparison, use `pixelmatch`:

```typescript
// tests/utils/chartComparison.ts
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

export interface ComparisonResult {
  mismatchPixels: number
  mismatchPercent: number
  diffImage: Buffer
}

export async function compareCharts(
  ssrBuffer: Buffer,
  clientBuffer: Buffer,
  threshold = 0.1
): Promise<ComparisonResult> {
  const ssr = PNG.sync.read(ssrBuffer)
  const client = PNG.sync.read(clientBuffer)

  // Ensure same dimensions
  if (ssr.width !== client.width || ssr.height !== client.height) {
    throw new Error(`Dimension mismatch: SSR ${ssr.width}x${ssr.height} vs Client ${client.width}x${client.height}`)
  }

  const diff = new PNG({ width: ssr.width, height: ssr.height })
  const mismatchPixels = pixelmatch(
    ssr.data,
    client.data,
    diff.data,
    ssr.width,
    ssr.height,
    { threshold }
  )

  const totalPixels = ssr.width * ssr.height
  const mismatchPercent = (mismatchPixels / totalPixels) * 100

  return {
    mismatchPixels,
    mismatchPercent,
    diffImage: PNG.sync.write(diff)
  }
}
```

### 3.6 Test Matrix

| # | Combination | Light Theme | Dark Theme | Priority |
|---|-------------|-------------|------------|----------|
| 1 | M-L-std | Required | Required | High |
| 2 | M-B-std | Required | Required | High |
| 3 | M-X-std | Required | Required | High |
| 4 | E-B-std | Required | Required | High |
| 5 | E-L-std | Optional | Optional | Medium |
| 6 | Z-L-std | Required | Required | High |
| 7 | Z-B-std | Optional | Optional | Medium |

### 3.7 CI Integration

```yaml
# .github/workflows/visual-tests.yml
name: Visual Regression Tests

on:
  pull_request:
    paths:
      - 'app/lib/chart/**'
      - 'server/utils/chartRenderer.ts'
      - 'app/components/charts/**'

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Start server
        run: npm run dev &

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run visual tests
        run: npx playwright test chart-visual-parity

      - name: Upload diff artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-diff
          path: test-results/
```

### 3.8 Acceptance Criteria

| Metric | Threshold | Action if Failed |
|--------|-----------|------------------|
| Pixel mismatch | < 2% | Pass |
| Pixel mismatch | 2-5% | Review diff image |
| Pixel mismatch | > 5% | Fail, investigate |

---

## Summary

### Current State

- **14 valid UI combinations** across View × Style × Metric
- **~57% E2E coverage** (8 of 14 combinations well-tested)
- **No visual parity testing** between client and SSR

### Recommended Actions

1. **Add missing E2E tests** for combinations 5, 6, 8, 9, 12, 14
2. **Add constraint enforcement E2E tests** for matrix, population, ASMR/LE
3. **Implement visual parity tests** comparing client vs SSR renders
4. **Add CI workflow** for visual regression on chart-related changes

### Files to Create

- `tests/e2e/explorer-combinations.spec.ts` - All combination loading tests
- `tests/e2e/explorer-constraints.spec.ts` - Constraint enforcement tests
- `tests/e2e/chart-visual-parity.spec.ts` - SSR vs client comparison
- `tests/utils/chartComparison.ts` - Pixel comparison utilities
- `.github/workflows/visual-tests.yml` - CI integration
