/**
 * String manipulation utilities
 */

export const left = (str: string, n: number) => str.substring(0, n)

export const right = (str: string, n: number) => str.slice(-n)

export const hashCode = (str: string) => {
  let hash = 0,
    i,
    chr
  if (str.length === 0) return hash
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

export const getCamelCase = (str: string) =>
  str
    .split(' ')
    .map((part: string) => {
      if (part.length < 3) return part
      const start = part.substring(0, 1).toUpperCase()
      const end = part.substring(1, part.length)
      return start + end
    })
    .join(' ')

export const capitalizeFirstLetter = (str: string): string =>
  str.replace(/^\w/, c => c.toUpperCase())

export const parseFourDigitNumber = (input: string) => {
  const regex = /\b\d{4}\b/
  const match = input.match(regex)
  if (match) return Number(match[0])
  return null
}

export const getFilename = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/ /gi, '_')

/**
 * Generate a descriptive filename for chart exports
 * @param title - Chart title
 * @param subtitle - Optional chart subtitle
 * @param extension - File extension (e.g., 'csv', 'json', 'png')
 * @returns Sanitized filename with date and extension
 */
export function generateChartFilename(
  title: string | string[],
  subtitle?: string,
  extension?: string
): string {
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const titleStr = typeof title === 'string' ? title : (Array.isArray(title) ? title[0] : 'chart')

  // Clean and combine title parts
  const parts = [titleStr, subtitle].filter(Boolean).join('-')
  const cleaned = parts
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .substring(0, 50) // Limit length

  return extension ? `${cleaned}-${date}.${extension}` : `${cleaned}-${date}`
}
