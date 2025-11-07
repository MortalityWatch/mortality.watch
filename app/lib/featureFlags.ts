/**
 * Feature Flags Library
 *
 * Utility functions for checking feature access and generating upgrade messages.
 * This library reads from the features.config.ts configuration file.
 */

import {
  FEATURES,
  TIERS,
  TIER_INFO,
  type FeatureKey,
  type UserTier
} from '~/config/features.config'

/**
 * Check if a user has access to a specific feature
 */
export function hasFeatureAccess(
  userTier: UserTier,
  feature: FeatureKey
): boolean {
  const requiredTier = FEATURES[feature].tier
  return userTier >= requiredTier
}

/**
 * Check if a feature requires an upgrade for the given user tier
 */
export function requiresUpgrade(
  userTier: UserTier,
  feature: FeatureKey
): boolean {
  return !hasFeatureAccess(userTier, feature)
}

/**
 * Get the minimum tier required for a feature
 */
export function getRequiredTier(feature: FeatureKey): UserTier {
  return FEATURES[feature].tier
}

/**
 * Get upgrade message for a feature based on current tier
 */
export function getUpgradeMessage(
  userTier: UserTier,
  feature: FeatureKey
): string {
  const requiredTier = FEATURES[feature].tier

  // Already has access
  if (userTier >= requiredTier) {
    return ''
  }

  // Need to register (Tier 1)
  if (requiredTier === TIERS.REGISTERED) {
    return 'Sign up for a free account to unlock this feature'
  }

  // Need Pro subscription (Tier 2)
  if (requiredTier === TIERS.PRO) {
    if (userTier === TIERS.PUBLIC) {
      return 'Sign up for free and upgrade to Pro to unlock this feature'
    }
    return 'Upgrade to Pro to unlock this feature'
  }

  return 'This feature requires an upgrade'
}

/**
 * Get the appropriate upgrade URL based on current tier and target feature
 */
export function getUpgradeUrl(
  userTier: UserTier,
  feature?: FeatureKey
): string {
  if (feature) {
    const requiredTier = FEATURES[feature].tier

    if (requiredTier === TIERS.REGISTERED && userTier === TIERS.PUBLIC) {
      return '/signup'
    }

    if (requiredTier === TIERS.PRO) {
      return userTier === TIERS.PUBLIC ? '/signup' : '/subscribe'
    }
  }

  // Default upgrade path
  if (userTier === TIERS.PUBLIC) {
    return '/signup'
  }

  return '/subscribe'
}

/**
 * Get upgrade CTA text based on current tier and target feature
 */
export function getUpgradeCTA(
  userTier: UserTier,
  feature?: FeatureKey
): string {
  if (feature) {
    const requiredTier = FEATURES[feature].tier

    if (requiredTier === TIERS.REGISTERED && userTier === TIERS.PUBLIC) {
      return 'Sign Up Free'
    }

    if (requiredTier === TIERS.PRO) {
      return userTier === TIERS.PUBLIC ? 'Sign Up & Upgrade' : 'Upgrade to Pro'
    }
  }

  // Default CTA
  return userTier === TIERS.PUBLIC ? 'Sign Up Free' : 'Upgrade to Pro'
}

/**
 * Get tier display name
 */
export function getTierName(tier: UserTier): string {
  return TIER_INFO[tier].name
}

/**
 * Get tier description
 */
export function getTierDescription(tier: UserTier): string {
  return TIER_INFO[tier].description
}

/**
 * Get feature display name
 */
export function getFeatureName(feature: FeatureKey): string {
  return FEATURES[feature].name
}

/**
 * Get feature description
 */
export function getFeatureDescription(feature: FeatureKey): string {
  return FEATURES[feature].description
}

/**
 * Check if user is at a specific tier level
 */
export function isTier(userTier: UserTier, targetTier: UserTier): boolean {
  return userTier === targetTier
}

/**
 * Check if user is at least a specific tier level
 */
export function isAtLeastTier(userTier: UserTier, targetTier: UserTier): boolean {
  return userTier >= targetTier
}

// Re-export for convenience
export { FEATURES, TIERS, TIER_INFO }
export type { FeatureKey, UserTier }
