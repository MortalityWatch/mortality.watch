// Test endpoint to compare yearly vs fluseason parsing
import { dataLoader } from '../services/dataLoader'

export default defineEventHandler(async () => {
  const results: Record<string, unknown> = {}

  // Test yearly
  try {
    const yearlyData = await dataLoader.loadMortalityData({
      chartType: 'yearly',
      countries: ['SWE'],
      ageGroups: ['all']
    })
    results.yearly = {
      success: true,
      keys: Object.keys(yearlyData),
      count: yearlyData.all?.SWE?.length || 0,
      firstRow: yearlyData.all?.SWE?.[0] || null
    }
  } catch (e) {
    results.yearly = { success: false, error: String(e) }
  }

  // Test fluseason
  try {
    const fluseasonData = await dataLoader.loadMortalityData({
      chartType: 'fluseason',
      countries: ['SWE'],
      ageGroups: ['all']
    })
    results.fluseason = {
      success: true,
      keys: Object.keys(fluseasonData),
      count: fluseasonData.all?.SWE?.length || 0,
      firstRow: fluseasonData.all?.SWE?.[0] || null
    }
  } catch (e) {
    results.fluseason = { success: false, error: String(e) }
  }

  return results
})
