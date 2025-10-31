/**
 * Scheduled Task: Check Data Staleness
 *
 * This task checks for stale data (>14 days old) and sends alerts to admins
 * Can be run as a cron job or scheduled task
 *
 * Usage:
 * - Add to cron: 0 9 * * * node server/tasks/check-data-staleness.ts
 * - Or use Nitro's scheduled tasks when available
 */

import { dataLoader } from '@/lib/dataLoader'
// sendEmail and db are auto-imported from server/utils
import { users } from '#db'
import { eq } from 'drizzle-orm'
import Papa from 'papaparse'
import type { CountryRaw } from '@/model/country'

const STALE_THRESHOLD_DAYS = 14

interface StaleCountry {
  iso3c: string
  jurisdiction: string
  daysSinceUpdate: number
  lastUpdate: string
  dataSource: string
}

export async function checkDataStaleness() {
  console.log('[Data Staleness Check] Starting check...')

  try {
    // Fetch metadata
    const metadataText = await dataLoader.fetchMetadata()
    const rawObjects = Papa.parse(metadataText, {
      header: true,
      skipEmptyLines: true
    }).data as CountryRaw[]

    const now = Date.now()
    const ONE_DAY = 24 * 60 * 60 * 1000

    // Find stale countries
    const staleCountries: StaleCountry[] = []

    for (const country of rawObjects) {
      const maxDate = new Date(country.max_date)
      const lastUpdateMs = maxDate.getTime()
      const daysSinceUpdate = Math.floor((now - lastUpdateMs) / ONE_DAY)

      if (daysSinceUpdate > STALE_THRESHOLD_DAYS) {
        staleCountries.push({
          iso3c: country.iso3c,
          jurisdiction: country.jurisdiction,
          daysSinceUpdate,
          lastUpdate: country.max_date,
          dataSource: country.source
        })
      }
    }

    console.log(`[Data Staleness Check] Found ${staleCountries.length} stale countries`)

    // If no stale countries, we're done
    if (staleCountries.length === 0) {
      console.log('[Data Staleness Check] All data is fresh. No alerts needed.')
      return {
        success: true,
        staleCount: 0,
        adminCount: 0,
        message: 'All data is fresh'
      }
    }

    // Sort by staleness (most stale first)
    staleCountries.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate)

    // Get admin users
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .all()

    if (admins.length === 0) {
      console.warn('[Data Staleness Check] No admin users found to send alerts')
      return {
        success: true,
        staleCount: staleCountries.length,
        adminCount: 0,
        message: 'No admin users to notify'
      }
    }

    // Send email to each admin
    const emailPromises = admins.map(async (admin: typeof users.$inferSelect) => {
      const html = generateStaleDataEmailHtml(staleCountries)

      try {
        await sendEmail({
          to: admin.email,
          subject: `⚠️ Data Staleness Alert - ${staleCountries.length} countries need attention`,
          html
        })
        console.log(`[Data Staleness Check] Alert sent to: ${admin.email}`)
      } catch (emailError) {
        console.error(`[Data Staleness Check] Failed to send alert to ${admin.email}:`, emailError)
      }
    })

    await Promise.allSettled(emailPromises)

    console.log(`[Data Staleness Check] Completed. Alerts sent to ${admins.length} admin(s)`)

    return {
      success: true,
      staleCount: staleCountries.length,
      adminCount: admins.length,
      message: `Found ${staleCountries.length} stale countries, notified ${admins.length} admin(s)`
    }
  } catch (error) {
    console.error('[Data Staleness Check] Error:', error)
    throw error
  }
}

function generateStaleDataEmailHtml(staleCountries: StaleCountry[]): string {
  const topStale = staleCountries.slice(0, 10)
  const remainingCount = Math.max(0, staleCountries.length - 10)

  const tableRows = topStale
    .map(
      country => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; font-weight: 500;">${country.jurisdiction}</td>
          <td style="padding: 12px 8px; font-family: monospace; font-size: 14px;">${country.iso3c}</td>
          <td style="padding: 12px 8px; color: ${country.daysSinceUpdate > 30 ? '#dc2626' : '#f59e0b'};">
            ${country.daysSinceUpdate} days
          </td>
          <td style="padding: 12px 8px; font-size: 14px; color: #6b7280;">${country.lastUpdate}</td>
          <td style="padding: 12px 8px; font-size: 14px; color: #6b7280;">${country.dataSource}</td>
        </tr>
      `
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Data Staleness Alert</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
          <!-- Header -->
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px;">
            <h1 style="color: #92400e; margin: 0 0 10px 0; font-size: 22px;">
              ⚠️ Data Staleness Alert
            </h1>
            <p style="margin: 0; color: #78350f;">
              ${staleCountries.length} countries have data that is more than ${STALE_THRESHOLD_DAYS} days old
            </p>
          </div>

          <!-- Summary -->
          <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
              <div style="text-align: center; padding: 15px; background-color: #fef3c7; border-radius: 6px;">
                <div style="font-size: 28px; font-weight: bold; color: #f59e0b;">${staleCountries.length}</div>
                <div style="font-size: 14px; color: #92400e; margin-top: 5px;">Stale Countries</div>
              </div>
              <div style="text-align: center; padding: 15px; background-color: #fee2e2; border-radius: 6px;">
                <div style="font-size: 28px; font-weight: bold; color: #dc2626;">${staleCountries[0]?.daysSinceUpdate ?? 0}</div>
                <div style="font-size: 14px; color: #991b1b; margin-top: 5px;">Most Stale (days)</div>
              </div>
              <div style="text-align: center; padding: 15px; background-color: #dbeafe; border-radius: 6px;">
                <div style="font-size: 28px; font-weight: bold; color: #2563eb;">${Math.floor(staleCountries.reduce((sum, c) => sum + c.daysSinceUpdate, 0) / staleCountries.length)}</div>
                <div style="font-size: 14px; color: #1e40af; margin-top: 5px;">Average (days)</div>
              </div>
            </div>
          </div>

          <!-- Top 10 Stale Countries -->
          <div style="padding: 20px;">
            <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #1f2937;">
              Most Stale Countries (Top 10)
            </h2>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                  <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Country</th>
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">ISO</th>
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Days Stale</th>
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Last Update</th>
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Source</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
              ${
                remainingCount > 0
                  ? `<p style="margin-top: 15px; font-size: 14px; color: #6b7280; font-style: italic;">
                    ...and ${remainingCount} more countries
                  </p>`
                  : ''
              }
            </div>
          </div>

          <!-- Action Button -->
          <div style="padding: 20px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 15px 0; color: #4b5563;">
              Review the full data quality report and take action:
            </p>
            <a
              href="${process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/data-quality"
              style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;"
            >
              View Data Quality Dashboard
            </a>
          </div>

          <!-- Footer -->
          <div style="padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              This is an automated daily alert from Mortality Watch
            </p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">
              <a href="${process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'}" style="color: #3b82f6; text-decoration: none;">
                mortality.watch
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

// Function is already exported above

// Allow direct execution if running as script
if (import.meta.url === `file://${process.argv[1]}`) {
  checkDataStaleness()
    .then((result) => {
      console.log('Result:', result)
      process.exit(0)
    })
    .catch((error) => {
      console.error('Error:', error)
      process.exit(1)
    })
}
