import { db, users, subscriptions } from '../db'
import { eq } from 'drizzle-orm'

// Note: FREE_TRIAL_DAYS is also defined in:
// - server/utils/inviteCode.ts (server-side)
// - nuxt.config.ts (client-side)
// All read from FREE_TRIAL_DAYS env var with default of 14

/**
 * Grant a free trial to a user (Pro access for limited time)
 * Usage: npx tsx scripts/grant-trial.ts user@example.com [days]
 *
 * Examples:
 *   npx tsx scripts/grant-trial.ts user@example.com        # 14-day trial (default)
 *   npx tsx scripts/grant-trial.ts user@example.com 30     # 30-day trial
 */

const FREE_TRIAL_DAYS = parseInt(process.env.FREE_TRIAL_DAYS || '14', 10)

const email = process.argv[2]
const days = parseInt(process.argv[3] || '') || FREE_TRIAL_DAYS

if (!email) {
  console.error('Usage: npx tsx scripts/grant-trial.ts user@example.com [days]')
  console.error('')
  console.error('Examples:')
  console.error('  npx tsx scripts/grant-trial.ts user@example.com        # 14-day trial')
  console.error('  npx tsx scripts/grant-trial.ts user@example.com 30     # 30-day trial')
  process.exit(1)
}

const user = await db
  .select({ id: users.id, email: users.email, tier: users.tier })
  .from(users)
  .where(eq(users.email, email))
  .get()

if (!user) {
  console.error(`❌ User not found: ${email}`)
  process.exit(1)
}

// Check for existing subscription
const existingSubscription = await db
  .select()
  .from(subscriptions)
  .where(eq(subscriptions.userId, user.id))
  .get()

if (existingSubscription?.status === 'active' && existingSubscription.stripeSubscriptionId) {
  console.error(`❌ ${email} already has an active paid subscription`)
  process.exit(1)
}

// Calculate trial end date
const trialEndDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

// Update user tier and subscription in a transaction
// Note: better-sqlite3 transactions are synchronous
db.transaction((tx) => {
  // Update user tier to Pro
  tx.update(users)
    .set({ tier: 2, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .run()

  // Create or update trial subscription
  if (existingSubscription) {
    tx.update(subscriptions)
      .set({
        status: 'trialing',
        currentPeriodEnd: trialEndDate,
        trialEnd: trialEndDate,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.userId, user.id))
      .run()
  } else {
    tx.insert(subscriptions)
      .values({
        userId: user.id,
        status: 'trialing',
        currentPeriodEnd: trialEndDate,
        trialEnd: trialEndDate,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .run()
  }
})

console.log(`✅ ${email} granted ${days}-day Pro trial`)
console.log(`   Trial ends: ${trialEndDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`)
process.exit(0)
