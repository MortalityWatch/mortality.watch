import { db, users, subscriptions, webhookEvents } from '../db'
import { eq, desc } from 'drizzle-orm'

/**
 * Check subscription status for a user
 * Usage: npx tsx scripts/check-subscription.ts user@example.com
 */

const email = process.argv[2]

if (!email) {
  console.error('Usage: npx tsx scripts/check-subscription.ts user@example.com')
  process.exit(1)
}

// Find user
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, email))
  .get()

if (!user) {
  console.error(`❌ User not found: ${email}`)
  process.exit(1)
}

console.log('\n=== User Info ===')
console.log(`ID: ${user.id}`)
console.log(`Email: ${user.email}`)
console.log(`Tier: ${user.tier}`)
console.log(`Role: ${user.role}`)

// Check subscription
const subscription = await db
  .select()
  .from(subscriptions)
  .where(eq(subscriptions.userId, user.id))
  .get()

console.log('\n=== Subscription ===')
if (subscription) {
  console.log(`Status: ${subscription.status}`)
  console.log(`Plan: ${subscription.plan}`)
  console.log(`Stripe Customer ID: ${subscription.stripeCustomerId}`)
  console.log(`Stripe Subscription ID: ${subscription.stripeSubscriptionId}`)
  console.log(`Current Period End: ${subscription.currentPeriodEnd}`)
  console.log(`Cancel At Period End: ${subscription.cancelAtPeriodEnd}`)
} else {
  console.log('❌ No subscription found for this user')
}

// Check recent webhook events
console.log('\n=== Recent Webhook Events (last 10) ===')
const events = await db
  .select()
  .from(webhookEvents)
  .orderBy(desc(webhookEvents.createdAt))
  .limit(10)
  .all()

if (events.length === 0) {
  console.log('❌ No webhook events found')
} else {
  for (const event of events) {
    const status = event.processed ? '✅' : event.processingError ? '❌' : '⏳'
    console.log(`${status} ${event.eventType} - ${event.stripeEventId} (${event.createdAt})`)
    if (event.processingError) {
      console.log(`   Error: ${event.processingError}`)
    }
  }
}
