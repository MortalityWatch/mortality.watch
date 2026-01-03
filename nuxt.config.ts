// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@vueuse/nuxt',
    'nuxt-og-image',
    'nuxt-umami',
    'nuxt-auth-utils'
  ],

  // Enable SSR globally
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

  // Color mode configuration - follows system preference by default
  colorMode: {
    preference: 'system', // default value of $colorMode.preference
    fallback: 'light', // fallback value if not system preference found
    classSuffix: '' // no suffix for dark/light class names
  },

  runtimeConfig: {
    // Server-side only config (not exposed to client)
    // Reuse JWT_SECRET for nuxt-auth-utils session encryption
    session: {
      password: process.env.JWT_SECRET || ''
    },
    mortalityDataS3Base: process.env.MORTALITY_DATA_S3_BASE || 'https://s3.mortality.watch/data/mortality',
    mortalityDataCacheDir: process.env.MORTALITY_DATA_CACHE_DIR || '.data/cache/mortality',
    mortalityDataFetchTimeout: parseInt(process.env.MORTALITY_DATA_FETCH_TIMEOUT || '30000', 10),
    public: {
      incognitoMode: process.env.NUXT_PUBLIC_INCOGNITO_MODE || '0',
      useLocalCache: process.env.NUXT_PUBLIC_USE_LOCAL_CACHE || 'false',
      devCountries: process.env.NUXT_PUBLIC_DEV_COUNTRIES || '',
      dataCachePath: '.data/cache/mortality',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://www.mortality.watch',
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      statsUrl: process.env.NUXT_PUBLIC_STATS_URL || 'https://stats.mortality.watch/',
      supportEmail: process.env.SUPPORT_EMAIL || 'mortalitywatch@proton.me'
    }
  },

  // Module aliases for db imports
  alias: {
    '#db': fileURLToPath(new URL('./db', import.meta.url))
  },

  // Route-specific rendering rules
  routeRules: {
    '/explorer': { ssr: true }, // SSR enabled for OG meta tags
    // Disable all prerendering to avoid build hangs from database connections
    '/': { ssr: true, prerender: false }, // Server-rendered (fetches dynamic featured charts)
    '/about': { ssr: true, prerender: false },
    '/sources': { ssr: true, prerender: false },
    '/donate': { ssr: true, prerender: false },
    '/ranking': { ssr: true, prerender: false }, // Server-rendered (fresh data)
    // Redirect /pricing to /features (permanent)
    '/pricing': { redirect: { to: '/features', statusCode: 301 } },
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
          // Allow iframe embedding in development for preview tools like Vibe Kanban
          ...(process.env.NODE_ENV !== 'development' && { 'X-Frame-Options': 'DENY' }),
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
          'Content-Security-Policy': [
            'default-src \'self\'',
            'script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' https://s3.mortality.watch https://stats.mortality.watch https://ua.mortality.watch https://js.stripe.com',
            'style-src \'self\' \'unsafe-inline\'',
            'img-src \'self\' data: https:',
            'font-src \'self\' data:',
            // Allow localhost for local stats API development and Umami analytics
            'connect-src \'self\' https://s3.mortality.watch https://stats.mortality.watch https://ua.mortality.watch https://api.stripe.com http://localhost:*',
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
  },

  // Umami Analytics configuration
  umami: {
    id: process.env.NUXT_UMAMI_ID || '',
    host: process.env.NUXT_UMAMI_HOST || 'https://ua.mortality.watch',
    autoTrack: true,
    ignoreLocalhost: true,
    enabled: !!process.env.NUXT_UMAMI_ID
  }
})
