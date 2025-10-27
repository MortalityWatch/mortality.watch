/**
 * Feature Access Composable
 *
 * Provides reactive feature access checking based on user tier.
 * Integrates with the authentication system to determine user permissions.
 */

import { computed } from 'vue'
import {
  hasFeatureAccess as checkFeatureAccess,
  requiresUpgrade as checkRequiresUpgrade,
  getUpgradeMessage as getUpgradeMsg,
  getUpgradeUrl as getUpgradeLink,
  getUpgradeCTA as getUpgradeCtaText,
  getRequiredTier,
  getFeatureName,
  getFeatureDescription,
  getTierName,
  FEATURES,
  TIERS,
  TIER_INFO,
  type FeatureKey,
  type UserTier
} from '~/lib/featureFlags'

/**
 * Composable for checking feature access and tier status
 */
export function useFeatureAccess() {
  // Get user tier from auth composable
  const { tier, isAuthenticated } = useAuth()

  // Computed tier helpers
  const isPublic = computed(() => tier.value === TIERS.PUBLIC)
  const isRegistered = computed(() => tier.value >= TIERS.REGISTERED)
  const isPro = computed(() => tier.value >= TIERS.PRO)

  /**
   * Check if user can access a specific feature
   */
  const can = (feature: FeatureKey): boolean => {
    return checkFeatureAccess(tier.value, feature)
  }

  /**
   * Check if a feature requires an upgrade for the current user
   */
  const requiresUpgrade = (feature: FeatureKey): boolean => {
    return checkRequiresUpgrade(tier.value, feature)
  }

  /**
   * Check if user cannot access a feature (inverse of can)
   */
  const cannot = (feature: FeatureKey): boolean => {
    return !can(feature)
  }

  /**
   * Get the minimum tier required for a feature
   */
  const requiredTier = (feature: FeatureKey): UserTier => {
    return getRequiredTier(feature)
  }

  /**
   * Get upgrade message for a specific feature
   */
  const getUpgradeMessage = (feature: FeatureKey): string => {
    return getUpgradeMsg(tier.value, feature)
  }

  /**
   * Get appropriate upgrade URL based on current tier and feature
   */
  const upgradeUrl = computed(() => {
    return getUpgradeLink(tier.value)
  })

  /**
   * Get upgrade URL for a specific feature
   */
  const getFeatureUpgradeUrl = (feature: FeatureKey): string => {
    return getUpgradeLink(tier.value, feature)
  }

  /**
   * Get upgrade CTA text based on current tier
   */
  const upgradeCTA = computed(() => {
    return getUpgradeCtaText(tier.value)
  })

  /**
   * Get upgrade CTA for a specific feature
   */
  const getFeatureUpgradeCTA = (feature: FeatureKey): string => {
    return getUpgradeCtaText(tier.value, feature)
  }

  /**
   * Get feature display name
   */
  const featureName = (feature: FeatureKey): string => {
    return getFeatureName(feature)
  }

  /**
   * Get feature description
   */
  const featureDescription = (feature: FeatureKey): string => {
    return getFeatureDescription(feature)
  }

  /**
   * Get current tier name
   */
  const currentTierName = computed(() => {
    return getTierName(tier.value)
  })

  return {
    // Tier info
    tier,
    currentTierName,
    isAuthenticated,
    isPublic,
    isRegistered,
    isPro,

    // Feature access checks
    can,
    cannot,
    requiresUpgrade,
    requiredTier,

    // Upgrade helpers
    upgradeUrl,
    upgradeCTA,
    getUpgradeMessage,
    getFeatureUpgradeUrl,
    getFeatureUpgradeCTA,

    // Feature info
    featureName,
    featureDescription,

    // Export constants for use in templates
    FEATURES,
    TIERS,
    TIER_INFO
  }
}
