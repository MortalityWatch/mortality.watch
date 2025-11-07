import { db, users, savedCharts } from '../db'
import { eq } from 'drizzle-orm'

/**
 * Seed script to create sample public charts for the gallery
 * Usage: npm run db:seed:gallery
 *
 * Creates sample public charts for the gallery view to demonstrate functionality
 * Requires users to exist first (run npm run db:seed first)
 */

interface ChartSeed {
  name: string
  description: string
  chartType: 'explorer' | 'ranking'
  isFeatured: boolean
  chartState: Record<string, unknown>
}

// Sample chart configurations
const sampleCharts: ChartSeed[] = [
  {
    name: 'US Mortality Trends 2000-2023',
    description: 'Comprehensive analysis of mortality trends in the United States over the past two decades',
    chartType: 'explorer',
    isFeatured: true,
    chartState: {
      countries: ['USA'],
      sex: 'both',
      age: '0',
      dateRange: { start: '2000-01-01', end: '2023-12-31' },
      chartMode: 'comparison'
    }
  },
  {
    name: 'European COVID-19 Impact',
    description: 'Comparing mortality patterns across major European countries during the COVID-19 pandemic',
    chartType: 'explorer',
    isFeatured: true,
    chartState: {
      countries: ['GBR', 'FRA', 'DEU', 'ITA', 'ESP'],
      sex: 'both',
      age: '0',
      dateRange: { start: '2020-01-01', end: '2023-12-31' },
      chartMode: 'comparison'
    }
  },
  {
    name: 'Age Group Analysis: 65+',
    description: 'Mortality trends for the 65+ age group across developed nations',
    chartType: 'explorer',
    isFeatured: false,
    chartState: {
      countries: ['USA', 'CAN', 'AUS', 'JPN'],
      sex: 'both',
      age: '65+',
      dateRange: { start: '2015-01-01', end: '2023-12-31' },
      chartMode: 'comparison'
    }
  },
  {
    name: 'Gender Differences in Mortality',
    description: 'Comparing male vs female mortality rates across different regions',
    chartType: 'explorer',
    isFeatured: false,
    chartState: {
      countries: ['USA', 'GBR', 'JPN'],
      sex: 'male',
      age: '0',
      dateRange: { start: '2010-01-01', end: '2023-12-31' },
      chartMode: 'comparison'
    }
  },
  {
    name: 'Global Mortality Rankings 2023',
    description: 'Ranking countries by excess mortality in 2023',
    chartType: 'ranking',
    isFeatured: true,
    chartState: {
      year: 2023,
      metric: 'excess_deaths',
      sortOrder: 'desc',
      limit: 50
    }
  },
  {
    name: 'Asia-Pacific Trends',
    description: 'Mortality analysis across Asia-Pacific countries',
    chartType: 'explorer',
    isFeatured: false,
    chartState: {
      countries: ['JPN', 'AUS', 'NZL', 'SGP', 'KOR'],
      sex: 'both',
      age: '0',
      dateRange: { start: '2018-01-01', end: '2023-12-31' },
      chartMode: 'comparison'
    }
  }
]

async function seedGalleryCharts() {
  console.log('Seeding gallery charts...')
  console.log('='.repeat(50))

  // Get the admin user to assign charts to
  const adminUser = await db
    .select()
    .from(users)
    .where(eq(users.email, 'admin@mortality.watch'))
    .get()

  if (!adminUser) {
    console.error('❌ Admin user not found!')
    console.log('\nPlease run `npm run db:seed` first to create test users.')
    process.exit(1)
  }

  console.log(`Found admin user: ${adminUser.email} (ID: ${adminUser.id})`)

  let created = 0
  let skipped = 0

  for (const chartData of sampleCharts) {
    // Generate slug from name
    const slug = chartData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now()

    console.log(`\nProcessing: ${chartData.name}`)

    try {
      // Check if a chart with similar name already exists
      const existing = await db
        .select()
        .from(savedCharts)
        .where(eq(savedCharts.name, chartData.name))
        .get()

      if (existing) {
        console.log('  ⏭️  Chart already exists, skipping...')
        skipped++
        continue
      }

      await db.insert(savedCharts).values({
        userId: adminUser.id,
        name: chartData.name,
        description: chartData.description,
        chartState: JSON.stringify(chartData.chartState),
        chartType: chartData.chartType,
        isPublic: true, // All seeded charts are public for gallery
        isFeatured: chartData.isFeatured,
        slug,
        viewCount: Math.floor(Math.random() * 500) // Random view count for demo
      })

      console.log(`  ✅ Created successfully! (Featured: ${chartData.isFeatured ? 'Yes' : 'No'})`)
      created++

      // Small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 10))
    } catch (error) {
      console.error(`  ❌ Failed to create chart: ${error}`)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`\n✅ Seeding completed!`)
  console.log(`   Created: ${created} chart${created !== 1 ? 's' : ''}`)
  console.log(`   Skipped: ${skipped} chart${skipped !== 1 ? 's' : ''}`)
  console.log('\n📊 Charts are now available at /charts')
  console.log('   Featured charts will appear first in the gallery')
}

seedGalleryCharts()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
