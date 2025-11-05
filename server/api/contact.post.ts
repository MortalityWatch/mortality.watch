import { z } from 'zod'
import { RequestThrottle } from '../utils/requestQueue'
import { sendEmail } from '../utils/email'

// Contact form validation schema
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message is too long'),
  chartUrl: z.string().url().optional()
})

// Rate limiter: 5 submissions per hour per IP
const contactThrottle = new RequestThrottle(
  60 * 60 * 1000, // 1 hour window
  5 // 5 requests max
)

/**
 * Contact Form Handler
 *
 * Validates contact form submissions, enforces rate limiting,
 * and sends email notifications to support team.
 */
export default defineEventHandler(async (event) => {
  // Get client IP for rate limiting
  const clientIp = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  // Check rate limit
  if (!contactThrottle.check(clientIp)) {
    const remaining = contactThrottle.getRemaining(clientIp)
    throw createError({
      statusCode: 429,
      message: `Too many contact form submissions. Please try again later. (${remaining} remaining)`
    })
  }

  // Parse and validate request body
  const body = await readBody(event)
  const result = contactSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]!.message,
      data: {
        errors: result.error.issues
      }
    })
  }

  const { name, email, subject, message, chartUrl } = result.data

  // Get support email from environment or use default
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@mortality.watch'

  // Build email body
  const emailBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Form Submission</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
          <h1 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 24px;">New Contact Form Submission</h1>

          <div style="background-color: white; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #666; font-size: 14px; font-weight: 600; text-transform: uppercase; margin: 0 0 10px 0;">From</h2>
            <p style="margin: 0 0 5px 0; color: #1a1a1a; font-weight: 600;">${name}</p>
            <p style="margin: 0; color: #666;">${email}</p>
          </div>

          <div style="background-color: white; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #666; font-size: 14px; font-weight: 600; text-transform: uppercase; margin: 0 0 10px 0;">Subject</h2>
            <p style="margin: 0; color: #1a1a1a;">${subject}</p>
          </div>

          <div style="background-color: white; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #666; font-size: 14px; font-weight: 600; text-transform: uppercase; margin: 0 0 10px 0;">Message</h2>
            <p style="margin: 0; color: #1a1a1a; white-space: pre-wrap;">${message}</p>
          </div>

          ${chartUrl
              ? `
          <div style="background-color: white; border-radius: 6px; padding: 20px;">
            <h2 style="color: #666; font-size: 14px; font-weight: 600; text-transform: uppercase; margin: 0 0 10px 0;">Chart URL</h2>
            <p style="margin: 0;">
              <a href="${chartUrl}" style="color: #3b82f6; text-decoration: none; word-break: break-all;">${chartUrl}</a>
            </p>
          </div>
          `
              : ''
          }
        </div>

        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>This message was sent via the Mortality Watch contact form.</p>
          <p>Reply directly to this email to respond to ${name}.</p>
        </div>
      </body>
    </html>
  `

  try {
    // Send email to support team
    await sendEmail({
      to: supportEmail,
      subject: `[Contact Form] ${subject}`,
      html: emailBody
    })

    // Log successful submission
    logger.info(`[Contact] Message from ${name} (${email}) sent to ${supportEmail}`)

    return {
      success: true,
      message: 'Your message has been sent successfully.'
    }
  } catch (error) {
    logger.error('Failed to send contact form email', error instanceof Error ? error : new Error(String(error)))

    // Throw error to be handled by error handler
    throw createError({
      statusCode: 500,
      message: 'Failed to send message. Please try again later.'
    })
  }
})
