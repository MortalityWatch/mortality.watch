#!/usr/bin/env node
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'

const S3_BASE = 'https://s3.mortality.watch/data/mortality'
const CACHE_DIR = '.data/cache/mortality'

// Chart types to download
const CHART_TYPES = [
  'weekly',
  'weekly_104w_sma',
  'weekly_52w_sma',
  'weekly_26w_sma',
  'weekly_13w_sma',
  'monthly',
  'quarterly',
  'yearly',
  'fluseason',
  'midyear'
]

// Age groups to download
const AGE_GROUPS = ['all', '0-14', '15-64', '65-74', '75-84', '85+']

// Default countries for development (subset)
const DEFAULT_COUNTRIES = ['USA', 'DEU', 'SWE']

interface DownloadStats {
  total: number
  downloaded: number
  skipped: number
  failed: number
}

const stats: DownloadStats = {
  total: 0,
  downloaded: 0,
  skipped: 0,
  failed: 0
}

function getAgeGroupSuffix(ag: string): string {
  return ag === 'all' ? '' : `_${ag}`
}

async function downloadFile(url: string, filePath: string): Promise<boolean> {
  try {
    // Skip if file already exists
    if (existsSync(filePath)) {
      stats.skipped++
      return true
    }

    const response = await fetch(url)
    if (!response.ok) {
      if (response.status === 404) {
        // 404 is expected for some country/age group combinations
        stats.skipped++
        return false
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.text()

    // Create directory if it doesn't exist
    const dir = dirname(filePath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    writeFileSync(filePath, data, 'utf-8')
    stats.downloaded++
    return true
  } catch (error) {
    // Network errors are common when offline - don't spam console
    if (error instanceof Error && (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND'))) {
      stats.failed++
      return false
    }
    console.error(`Failed to download ${url}:`, error)
    stats.failed++
    return false
  }
}

interface CountryMetadata {
  iso3c: string
  jurisdiction: string
  type: number
  source: string
  min_date: string
  max_date: string
  age_groups: string
}

async function downloadMetadata(): Promise<Map<string, CountryMetadata[]>> {
  console.log('📥 Downloading world_meta.csv...')
  const url = `${S3_BASE}/world_meta.csv`
  const filePath = join(CACHE_DIR, 'world_meta.csv')

  let data: string

  // Try to download, or use cached version if offline
  const success = await downloadFile(url, filePath)
  if (!success && !existsSync(filePath)) {
    throw new Error('Failed to download world_meta.csv and no cached version found')
  }

  // Read from local file (either just downloaded or previously cached)
  const { readFileSync } = await import('fs')
  try {
    data = readFileSync(filePath, 'utf-8')
    if (!success) {
      console.log('   Using cached version (offline mode)')
    }
  } catch {
    throw new Error('Failed to read world_meta.csv')
  }

  // Parse metadata to get available data for each country
  const { default: Papa } = await import('papaparse')
  const parsed = Papa.parse(data, { header: true })

  const countryMetadata = new Map<string, CountryMetadata[]>()

  for (const row of parsed.data as Record<string, unknown>[]) {
    if (typeof row.iso3c === 'string' && row.iso3c) {
      const metadata: CountryMetadata = {
        iso3c: row.iso3c as string,
        jurisdiction: row.jurisdiction as string || '',
        type: parseInt(row.type as string) || 0,
        source: row.source as string || '',
        min_date: row.min_date as string || '',
        max_date: row.max_date as string || '',
        age_groups: row.age_groups as string || 'all'
      }

      if (!countryMetadata.has(metadata.iso3c)) {
        countryMetadata.set(metadata.iso3c, [])
      }
      countryMetadata.get(metadata.iso3c)!.push(metadata)
    }
  }

  return countryMetadata
}

async function downloadCountryData(
  country: string,
  metadata: CountryMetadata[]
): Promise<void> {
  const countryDir = join(CACHE_DIR, country)

  // Determine available age groups from metadata
  const availableAgeGroups = new Set<string>()
  for (const meta of metadata) {
    // age_groups field can be 'all' or comma-separated list
    const groups = meta.age_groups.split(',').map(g => g.trim())
    groups.forEach(g => availableAgeGroups.add(g))
  }

  // If no specific age groups listed, try all
  const ageGroupsToDownload = availableAgeGroups.size > 0
    ? Array.from(availableAgeGroups)
    : AGE_GROUPS

  for (const chartType of CHART_TYPES) {
    for (const ageGroup of ageGroupsToDownload) {
      const agSuffix = getAgeGroupSuffix(ageGroup)
      const fileName = `${chartType}${agSuffix}.csv`
      const url = `${S3_BASE}/${country}/${fileName}`
      const filePath = join(countryDir, fileName)

      stats.total++
      await downloadFile(url, filePath)
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  const downloadAll = args.includes('--all')

  console.log('🚀 Starting data download...\n')

  // Download and parse metadata
  const countryMetadata = await downloadMetadata()
  const allCountries = Array.from(countryMetadata.keys())
  console.log(`✅ Found ${allCountries.length} countries in metadata\n`)

  // Determine which countries to download
  let countries: string[]

  // Check for environment variable override
  const envCountries = process.env.NUXT_PUBLIC_DEV_COUNTRIES

  if (envCountries) {
    // Use countries from environment variable
    countries = envCountries.split(',').map(c => c.trim()).filter(c => c)
    console.log(`📌 Using countries from NUXT_PUBLIC_DEV_COUNTRIES: ${countries.join(', ')}`)

    // Validate countries exist in metadata
    const invalidCountries = countries.filter(c => !countryMetadata.has(c))
    if (invalidCountries.length > 0) {
      console.warn(`⚠️  Warning: These countries not found in metadata: ${invalidCountries.join(', ')}`)
    }
  } else if (downloadAll) {
    countries = allCountries
  } else {
    countries = DEFAULT_COUNTRIES.filter(c => countryMetadata.has(c))
  }

  console.log(`📦 Downloading data for ${countries.length} countries...`)
  if (!downloadAll && !envCountries) {
    console.log(`   (Use --all to download all ${allCountries.length} countries)`)
    console.log(`   (Or set NUXT_PUBLIC_DEV_COUNTRIES=USA,GBR,... for custom subset)\n`)
  } else {
    console.log()
  }

  // Download country data
  for (let i = 0; i < countries.length; i++) {
    const country = countries[i]
    const metadata = countryMetadata.get(country) || []
    const progress = `[${i + 1}/${countries.length}]`
    process.stdout.write(`${progress} ${country}... `)

    await downloadCountryData(country, metadata)

    console.log('✓')
  }

  // Print summary
  console.log('\n📊 Summary:')
  console.log(`   Total files attempted: ${stats.total}`)
  console.log(`   Downloaded: ${stats.downloaded}`)
  console.log(`   Skipped (already exists or not available): ${stats.skipped}`)
  console.log(`   Failed: ${stats.failed}`)
  console.log(`\n✨ Done! Data cached in ${CACHE_DIR}`)
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
