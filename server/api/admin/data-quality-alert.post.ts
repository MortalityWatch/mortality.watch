import { sendEmail } from '~/server/utils/email'
import { db } from '~/server/utils/db'
import { users } from '#db'
import { eq } from 'drizzle-orm'

/**
 * Admin API: Send data quality alert email
 * POST /api/admin/data-quality-alert
 *
 * Internal API used by validation system to alert admins
 * Does not require authentication (internal use only)
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { dataType, error, timestamp } = body

  if (!dataType || !error) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: dataType, error'
    })
  }

  try {
    // Get all admin users
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .all()

    if (admins.length === 0) {
      console.warn('No admin users found to send data quality alert')
      return { success: true, message: 'No admin users to notify' }
    }

    // Send email to each admin
    const emailPromises = admins.map(async (admin) => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Data Quality Alert</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
              <h1 style="color: #991b1b; margin: 0 0 10px 0; font-size: 20px;">
                ⚠️ Data Quality Alert
              </h1>
              <p style="margin: 0; color: #7f1d1d;">
                A data validation failure has been detected in the Mortality Watch system.
              </p>
            </div>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 18px;">Alert Details</h2>

              <div style="margin-bottom: 10px;">
                <strong style="color: #666;">Data Type:</strong>
                <div style="font-family: monospace; background-color: #fff; padding: 8px; border-radius: 4px; margin-top: 5px;">
                  ${dataType}
                </div>
              </div>

              <div style="margin-bottom: 10px;">
                <strong style="color: #666;">Timestamp:</strong>
                <div style="font-family: monospace; background-color: #fff; padding: 8px; border-radius: 4px; margin-top: 5px;">
                  ${timestamp || new Date().toISOString()}
                </div>
              </div>

              <div>
                <strong style="color: #666;">Error Details:</strong>
                <div style="font-family: monospace; background-color: #fff; padding: 8px; border-radius: 4px; margin-top: 5px; overflow-x: auto; font-size: 12px;">
                  ${error}
                </div>
              </div>
            </div>

            <div style="background-color: #dbeafe; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">
                📋 Action Required
              </h3>
              <p style="margin: 0 0 10px 0; color: #1e3a8a;">
                The system has automatically fallen back to using cached data to prevent service disruption.
              </p>
              <p style="margin: 0 0 15px 0; color: #1e3a8a;">
                Please investigate the data source and resolve the validation issues as soon as possible.
              </p>
              <div style="text-align: center;">
                <a
                  href="${process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/data-quality"
                  style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;"
                >
                  View Data Quality Dashboard
                </a>
              </div>
            </div>

            <div style="text-align: center; color: #999; font-size: 12px;">
              <p>This is an automated alert from Mortality Watch</p>
              <p style="margin-top: 5px;">
                <a href="${process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'}" style="color: #3b82f6;">
                  mortality.watch
                </a>
              </p>
            </div>
          </body>
        </html>
      `

      try {
        await sendEmail({
          to: admin.email,
          subject: `⚠️ Data Quality Alert - ${dataType}`,
          html
        })
        console.log(`Data quality alert sent to admin: ${admin.email}`)
      } catch (emailError) {
        console.error(`Failed to send alert to ${admin.email}:`, emailError)
      }
    })

    await Promise.allSettled(emailPromises)

    return {
      success: true,
      message: `Alert sent to ${admins.length} admin(s)`
    }
  } catch (err) {
    console.error('Error sending data quality alert:', err)
    throw createError({
      statusCode: 500,
      message: err instanceof Error ? err.message : 'Failed to send alert'
    })
  }
})
