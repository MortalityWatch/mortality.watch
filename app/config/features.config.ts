/**
 * Feature Flags Configuration
 *
 * This file defines the three-tier access system and feature gates.
 * Edit this file to change which features are available at each tier.
 */

/**
 * User tier definitions
 */
export const TIERS = {
  PUBLIC: 0,
  REGISTERED: 1,
  PRO: 2
} as const

export type UserTier = typeof TIERS[keyof typeof TIERS]

/**
 * Tier metadata
 */
export const TIER_INFO = {
  [TIERS.PUBLIC]: {
    name: 'Public',
    description: 'Free anonymous access',
    price: 'Free',
    signupRequired: false
  },
  [TIERS.REGISTERED]: {
    name: 'Registered',
    description: 'Free account with extended features',
    price: 'Free',
    signupRequired: true
  },
  [TIERS.PRO]: {
    name: 'Pro',
    description: 'Premium subscription with advanced features',
    price: '$9.99/month',
    signupRequired: true
  }
} as const

/**
 * Feature definitions
 *
 * Each feature has:
 * - tier: Minimum tier required to access (0, 1, or 2)
 * - name: Display name for the feature
 * - description: Brief description of what the feature does
 * - category: Grouping for organization (optional)
 */
export const FEATURES = {
  // ==========================================
  // TIER 0 (PUBLIC) - Basic functionality
  // ==========================================

  VIEW_CHARTS: {
    tier: TIERS.PUBLIC,
    name: 'View Charts',
    description: 'View and explore mortality charts',
    category: 'core'
  },

  BASIC_CONTROLS: {
    tier: TIERS.PUBLIC,
    name: 'Basic Controls',
    description: 'Access to basic chart controls',
    category: 'core'
  },

  SHARE_URL: {
    tier: TIERS.PUBLIC,
    name: 'Share URL',
    description: 'Share charts via URL',
    category: 'core'
  },

  VIEW_RANKING: {
    tier: TIERS.PUBLIC,
    name: 'View Rankings',
    description: 'View ranking page',
    category: 'core'
  },

  CONSERVATIVE_BASELINE: {
    tier: TIERS.PUBLIC,
    name: 'Conservative Baseline',
    description: '3-year mean baseline method',
    category: 'analysis'
  },

  // ==========================================
  // TIER 1 (REGISTERED - FREE) - Extended features
  // ==========================================

  SAVE_CHARTS: {
    tier: TIERS.REGISTERED,
    name: 'Save Charts',
    description: 'Save charts to "My Charts"',
    category: 'storage'
  },

  CUSTOM_COLORS: {
    tier: TIERS.REGISTERED,
    name: 'Custom Colors',
    description: 'Customize chart color schemes',
    category: 'customization'
  },

  EXPORT_DATA: {
    tier: TIERS.REGISTERED,
    name: 'Export Data',
    description: 'Export chart data as CSV or JSON',
    category: 'export'
  },

  ALL_BASELINES: {
    tier: TIERS.REGISTERED,
    name: 'All Baseline Methods',
    description: 'Access to all baseline calculation methods',
    category: 'analysis'
  },

  SAVE_RANKINGS: {
    tier: TIERS.REGISTERED,
    name: 'Save Rankings',
    description: 'Save ranking configurations',
    category: 'storage'
  },

  EXTENDED_TIME_PERIODS: {
    tier: TIERS.REGISTERED,
    name: 'Extended Time Periods',
    description: 'Access to full historical data',
    category: 'data'
  },

  // ==========================================
  // TIER 2 (PRO - PAID) - Advanced features
  // ==========================================

  HIDE_WATERMARK: {
    tier: TIERS.PRO,
    name: 'Hide Watermark',
    description: 'Remove site watermark from charts',
    category: 'branding'
  },

  HIDE_QR: {
    tier: TIERS.PRO,
    name: 'Hide QR Code',
    description: 'Remove QR code from charts',
    category: 'branding'
  },

  ADVANCED_LE: {
    tier: TIERS.PRO,
    name: 'Advanced Life Expectancy',
    description: 'Single age group LE calculations',
    category: 'analysis'
  },

  Z_SCORES: {
    tier: TIERS.PRO,
    name: 'Z-Scores',
    description: 'Statistical z-score calculations',
    category: 'analysis'
  },

  AGE_STANDARDIZED: {
    tier: TIERS.PRO,
    name: 'Age Standardized Deaths',
    description: 'Age-standardized death rates (Levitt method)',
    category: 'analysis'
  },

  PRIORITY_SUPPORT: {
    tier: TIERS.PRO,
    name: 'Priority Support',
    description: 'Priority customer support',
    category: 'support'
  },

  API_ACCESS: {
    tier: TIERS.PRO,
    name: 'API Access',
    description: 'REST API access (coming soon)',
    category: 'api'
  }
} as const

export type FeatureKey = keyof typeof FEATURES

/**
 * Feature categories for organization
 */
export const FEATURE_CATEGORIES = {
  core: 'Core Features',
  analysis: 'Analysis Methods',
  storage: 'Save & Storage',
  customization: 'Customization',
  export: 'Data Export',
  data: 'Data Access',
  branding: 'Branding',
  support: 'Support',
  api: 'API'
} as const

/**
 * Get all features for a specific tier
 */
export function getFeaturesByTier(tier: UserTier): FeatureKey[] {
  return Object.entries(FEATURES)
    .filter(([_, config]) => config.tier === tier)
    .map(([key]) => key as FeatureKey)
}

/**
 * Get all features available up to and including a tier
 */
export function getAvailableFeatures(tier: UserTier): FeatureKey[] {
  return Object.entries(FEATURES)
    .filter(([_, config]) => config.tier <= tier)
    .map(([key]) => key as FeatureKey)
}

/**
 * Group features by category
 */
export function getFeaturesByCategory(tier?: UserTier) {
  const features = tier !== undefined
    ? getAvailableFeatures(tier)
    : Object.keys(FEATURES) as FeatureKey[]

  const grouped: Record<string, FeatureKey[]> = {}

  for (const key of features) {
    const feature = FEATURES[key]
    const category = feature.category || 'other'

    if (!grouped[category]) {
      grouped[category] = []
    }

    grouped[category].push(key)
  }

  return grouped
}
