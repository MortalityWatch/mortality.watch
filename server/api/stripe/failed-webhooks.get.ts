import { requireAuth } from '../../utils/auth'
import { db, webhookEvents } from '#db'
import { isNotNull, desc } from 'drizzle-orm'

/**
 * Get failed webhook events
 * Admin endpoint to view webhook events that failed processing
 *
 * This allows monitoring and debugging of webhook failures
 */
export default defineEventHandler(async (event) => {
  // Require authentication (should also check for admin role in production)
  await requireAuth(event)

  try {
    // Get query parameters
    const query = getQuery(event)
    const limit = Math.min(Number(query.limit) || 50, 100) // Max 100

    // Find webhook events that have processing errors
    const failedEvents = await db
      .select({
        id: webhookEvents.id,
        stripeEventId: webhookEvents.stripeEventId,
        eventType: webhookEvents.eventType,
        processed: webhookEvents.processed,
        processingError: webhookEvents.processingError,
        createdAt: webhookEvents.createdAt,
        processedAt: webhookEvents.processedAt
      })
      .from(webhookEvents)
      .where(isNotNull(webhookEvents.processingError))
      .orderBy(desc(webhookEvents.createdAt))
      .limit(limit)
      .all()

    return {
      success: true,
      count: failedEvents.length,
      events: failedEvents
    }
  } catch (error) {
    logger.error('Error fetching failed webhooks:', error instanceof Error ? error : new Error(String(error)))
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch webhook events'
    })
  }
})
