import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'node',
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/e2e/**', // Exclude Playwright E2E tests
      '**/.{idea,git,cache,output,temp}/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.{ts,vue}'],
      exclude: [
        // Test files
        'app/**/*.spec.ts',
        'app/**/*.test.ts',
        // Vue components (should be tested with E2E/component tests)
        'app/**/*.vue',
        // Pages (should be tested with E2E tests)
        'app/pages/**',
        // Layouts (should be tested with E2E tests)
        'app/layouts/**',
        // Plugins (require Nuxt runtime)
        'app/plugins/**',
        // Type definitions
        'app/**/*.d.ts',
        'app/globals/**',
        'app/types/**',
        // Composables that require Nuxt runtime
        'app/composables/useIncognitoMode.ts',
        'app/composables/useChartDataLoader.ts',
        'app/composables/useChartOgImage.ts',
        'app/composables/useCountryFilter.ts',
        'app/composables/useDateRangeValidation.ts',
        'app/composables/useJurisdictionFilter.ts',
        'app/composables/useLoading.ts',
        'app/composables/usePagination.ts',
        'app/composables/usePeriodFormat.ts',
        'app/composables/useRankingTableSort.ts',
        // Files that require Nuxt/Vue runtime
        'app/app.config.ts',
        'app/app.vue',
        'app/error.vue',
        'app/chart.ts',
        'app/colors.ts',
        'app/data.ts',
        'app/toast.ts',
        // Chart plugins (require Chart.js/Canvas runtime)
        'app/lib/chart/backgroundPlugin.ts',
        'app/lib/chart/chartColors.ts',
        'app/lib/chart/chartConfig.ts',
        'app/lib/chart/chartStyling.ts',
        'app/lib/chart/chartTypes.ts',
        'app/lib/chart/logoPlugin.ts',
        'app/lib/chart/qrCodePlugin.ts',
        // Compression (requires browser/node specific APIs)
        'app/lib/compression/**',
        // Constants (no logic to test)
        'app/lib/constants.ts',
        'app/lib/sourcesConstants.ts',
        'app/lib/lib.ts',
        // Type-only files
        'app/lib/ranking/types.ts',
        'app/model/serializable.ts',
        'app/model/state.ts',
        'node_modules/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./app', import.meta.url)),
      '~': fileURLToPath(new URL('./app', import.meta.url))
    }
  }
})
