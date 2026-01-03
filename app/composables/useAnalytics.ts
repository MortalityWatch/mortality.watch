/**
 * Analytics composable for tracking user interactions with Umami
 *
 * Provides semantic event tracking methods for mortality.watch features.
 * Uses Umami's umTrackEvent under the hood.
 *
 * Event naming convention: category_action (e.g., chart_save, auth_signup)
 */

export function useAnalytics() {
  /**
   * Track a custom event with optional data
   */
  function trackEvent(name: string, data?: Record<string, string | number | boolean>) {
    if (import.meta.server) return
    umTrackEvent(name, data)
  }

  // ============================================
  // Authentication Events
  // ============================================

  function trackSignup(method: 'email' | 'invite' = 'email') {
    trackEvent('auth_signup', { method })
  }

  function trackLogin() {
    trackEvent('auth_login')
  }

  function trackLogout() {
    trackEvent('auth_logout')
  }

  // ============================================
  // Chart Interaction Events
  // ============================================

  function trackChartView(chartType: 'explorer' | 'ranking' | 'discover' | 'saved', country?: string) {
    trackEvent('chart_view', {
      type: chartType,
      ...(country && { country })
    })
  }

  function trackChartSave(isPublic: boolean) {
    trackEvent('chart_save', { public: isPublic })
  }

  function trackChartShare(method: 'link' | 'download' | 'screenshot') {
    trackEvent('chart_share', { method })
  }

  function trackChartExport(format: 'csv' | 'json') {
    trackEvent('chart_export', { format })
  }

  function trackChartSortByValue() {
    trackEvent('chart_sort_by_value')
  }

  // ============================================
  // Navigation Events
  // ============================================

  function trackNavigation(destination: string, source?: string) {
    trackEvent('navigation', {
      to: destination,
      ...(source && { from: source })
    })
  }

  function trackExternalLink(url: string) {
    trackEvent('external_link', { url })
  }

  // ============================================
  // Feature Usage Events
  // ============================================

  function trackFeatureGate(feature: string, action: 'view' | 'upgrade_click') {
    trackEvent('feature_gate', { feature, action })
  }

  function trackTutorialStart(page: 'explorer' | 'ranking') {
    trackEvent('tutorial_start', { page })
  }

  function trackTutorialComplete(page: 'explorer' | 'ranking') {
    trackEvent('tutorial_complete', { page })
  }

  function trackColorModeChange(mode: 'light' | 'dark' | 'system') {
    trackEvent('color_mode_change', { mode })
  }

  // ============================================
  // Subscription Events
  // ============================================

  function trackSubscriptionView(plan?: 'monthly' | 'yearly') {
    trackEvent('subscription_view', plan ? { plan } : {})
  }

  function trackSubscriptionStart(plan: 'monthly' | 'yearly') {
    trackEvent('subscription_start', { plan })
  }

  // ============================================
  // Search/Filter Events
  // ============================================

  function trackSearch(query: string, resultCount: number) {
    trackEvent('search', {
      query: query.substring(0, 50), // Truncate long queries
      results: resultCount
    })
  }

  function trackFilterChange(filterType: string, value: string) {
    trackEvent('filter_change', { type: filterType, value })
  }

  // ============================================
  // Country/Data Selection Events
  // ============================================

  function trackCountrySelect(country: string, context: 'explorer' | 'discover' | 'ranking') {
    trackEvent('country_select', { country, context })
  }

  function trackMetricChange(metric: string) {
    trackEvent('metric_change', { metric })
  }

  function trackAgeGroupChange(ageGroup: string) {
    trackEvent('age_group_change', { age_group: ageGroup })
  }

  // ============================================
  // Error Events
  // ============================================

  function trackError(errorType: string, message?: string) {
    trackEvent('error', {
      type: errorType,
      ...(message && { message: message.substring(0, 100) })
    })
  }

  return {
    // Generic
    trackEvent,

    // Auth
    trackSignup,
    trackLogin,
    trackLogout,

    // Charts
    trackChartView,
    trackChartSave,
    trackChartShare,
    trackChartExport,
    trackChartSortByValue,

    // Navigation
    trackNavigation,
    trackExternalLink,

    // Features
    trackFeatureGate,
    trackTutorialStart,
    trackTutorialComplete,
    trackColorModeChange,

    // Subscriptions
    trackSubscriptionView,
    trackSubscriptionStart,

    // Search/Filters
    trackSearch,
    trackFilterChange,

    // Data selection
    trackCountrySelect,
    trackMetricChange,
    trackAgeGroupChange,

    // Errors
    trackError
  }
}
