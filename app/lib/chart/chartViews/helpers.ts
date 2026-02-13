/**
 * Chart View Helpers
 *
 * Shared utility functions used across chart views
 */

/**
 * Get age group suffix for title
 * Returns empty string for 'all', otherwise returns [ageGroup]
 */
export function getAgeGroupSuffix(ageGroups: string[]): string {
  if (ageGroups.length === 1 && ageGroups[0] !== 'all') {
    return ` [${ageGroups[0]}]`
  }
  return ''
}

/**
 * Get ASMR standard population title
 */
export function getASMRTitle(countries: string[], standardPopulation: string): string {
  const asmrTitles: Record<string, string> = {
    who: 'WHO Standard Population',
    esp: 'European Standard Population',
    usa: 'U.S. Standard Population'
  }

  if (standardPopulation === 'country') {
    return `${countries.join(',')} 2020 Standard Population`
  }

  const title = asmrTitles[standardPopulation]
  if (!title) {
    throw new Error(`Unrecognized standard population key: ${standardPopulation}`)
  }

  return title
}

/**
 * Get baseline description text
 */
export function getBaselineDescription(
  baselineMethod: string,
  baselineDateFrom: string,
  baselineDateTo: string
): string {
  const methodNames: Record<string, string> = {
    mean: 'Average',
    median: 'Median',
    naive: 'Last Value',
    lin_reg: 'Linear Regression',
    exp: 'Exponential Smoothing (ETS)'
  }

  const methodName = methodNames[baselineMethod] || baselineMethod

  if (baselineMethod === 'naive') {
    return `Baseline: ${methodName} ${baselineDateTo}`
  }

  return `Baseline: ${methodName} ${baselineDateFrom}-${baselineDateTo}`
}
