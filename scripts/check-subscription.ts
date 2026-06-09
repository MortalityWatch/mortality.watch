import { db, users, subscriptions } from '../db'
import { eq } from 'drizzle-orm'

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
  console.log(`Current Period End: ${subscription.currentPeriodEnd}`)
  console.log(`Cancel At Period End: ${subscription.cancelAtPeriodEnd}`)
} else {
  console.log('❌ No subscription found for this user')
}
