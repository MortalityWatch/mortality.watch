export default defineNuxtRouteMiddleware(async () => {
  const { can, getFeatureUpgradeUrl } = useFeatureAccess()

  // Redirect non-pro users to upgrade page
  if (!can('BROWSE_ALL_CHARTS')) {
    return navigateTo(getFeatureUpgradeUrl('BROWSE_ALL_CHARTS'))
  }
})
