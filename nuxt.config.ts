// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  // Enable SSR globally

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@vueuse/nuxt',
    'nuxt-og-image'
  ],
  ssr: true,

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  vue: {
    compilerOptions: {
      isCustomElement: tag => tag === 'stripe-buy-button'
    }
  },

  runtimeConfig: {
    public: {
      incognitoMode: process.env.NUXT_PUBLIC_INCOGNITO_MODE || '0',
      useLocalCache: process.env.NUXT_PUBLIC_USE_LOCAL_CACHE || 'false',
      devCountries: process.env.NUXT_PUBLIC_DEV_COUNTRIES || '',
      dataCachePath: '.data/cache/mortality',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://www.mortality.watch'
    }
  },

  // Module aliases for db imports
  alias: {
    '#db': fileURLToPath(new URL('./db', import.meta.url))
  },

  // Route-specific rendering rules
  routeRules: {
    '/explorer': { ssr: false }, // Client-only (interactive)
    // Disable prerendering in CI to avoid build hangs
    '/': { prerender: process.env.CI !== 'true' }, // Pre-rendered (SEO)
    '/about': { prerender: process.env.CI !== 'true' },
    '/sources': { prerender: process.env.CI !== 'true' },
    '/donate': { prerender: process.env.CI !== 'true' },
    '/ranking': { ssr: true }, // Server-rendered (fresh data)
    // Exclude test pages from production prerendering (dev-only)
    '/test-data': { prerender: false },
    '/test-fetch': { prerender: false },
    '/test-ranking': { prerender: false }
  },

  // Disable source maps in production to reduce memory usage during build
  sourcemap: {
    server: false,
    client: false
  },

  compatibilityDate: '2025-08-16',

  // Security headers
  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
          'Content-Security-Policy': [
            'default-src \'self\'',
            'script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' https://s3.mortality.watch https://stats.mortality.watch https://js.stripe.com',
            'style-src \'self\' \'unsafe-inline\'',
            'img-src \'self\' data: https:',
            'font-src \'self\' data:',
            'connect-src \'self\' https://s3.mortality.watch https://stats.mortality.watch https://api.stripe.com',
            'frame-src https://js.stripe.com',
            'child-src https://js.stripe.com'
          ].join('; ')
        }
      }
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
