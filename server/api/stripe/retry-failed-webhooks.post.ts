import { requireAuth } from '../../utils/auth'
import { db, webhookEvents } from '#db'
import { eq, and, isNotNull } from 'drizzle-orm'

/**
 * Retry failed webhook events
 * Admin endpoint to manually retry webhook events that failed processing
 *
 * Note: This is a basic implementation. In production, you'd want:
 * - Admin-only access control
 * - Rate limiting
 * - Background job queue
 * - Monitoring/alerting
 */
export default defineEventHandler(async (event) => {
  // Require authentication (should also check for admin role in production)
  await requireAuth(event)

  try {
    // Find webhook events that failed processing
    const failedEvents = await db
      .select()
      .from(webhookEvents)
      .where(
        and(
          eq(webhookEvents.processed, false),
          isNotNull(webhookEvents.processingError)
        )
      )
      .limit(10) // Process max 10 at a time to avoid timeouts
      .all()

    if (failedEvents.length === 0) {
      return {
        success: true,
        message: 'No failed webhook events to retry',
        retriedCount: 0
      }
    }

    let retriedCount = 0
    const errors: Array<{ eventId: string, error: string }> = []

    for (const failedEvent of failedEvents) {
      try {
        // Reset the processing error to allow Stripe to retry on next webhook delivery
        // In production, you'd want to actually re-process the event here
        // by calling the appropriate handler based on event type
        console.log(`Retrying webhook event ${failedEvent.stripeEventId}`)

        // Clear the error to allow retry
        await db
          .update(webhookEvents)
          .set({
            processingError: null
          })
          .where(eq(webhookEvents.id, failedEvent.id))

        retriedCount++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        errors.push({
          eventId: failedEvent.stripeEventId,
          error: errorMessage
        })
        console.error(`Failed to retry webhook ${failedEvent.stripeEventId}:`, error)
      }
    }

    return {
      success: true,
      message: `Reset ${retriedCount} failed webhook events for retry`,
      retriedCount,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error) {
    console.error('Error retrying failed webhooks:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to retry webhook events'
    })
  }
})
