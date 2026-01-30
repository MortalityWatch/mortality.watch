import { db, users, subscriptions } from '../db'
import { sql, eq } from 'drizzle-orm'

/**
 * Show user statistics by tier and subscription status
 * Usage: npx tsx scripts/user-stats.ts
 */

// Count users by tier
const tierCounts = await db
  .select({
    tier: users.tier,
    count: sql<number>`count(*)`
  })
  .from(users)
  .groupBy(users.tier)
  .all()

// Count users by role
const roleCounts = await db
  .select({
    role: users.role,
    count: sql<number>`count(*)`
  })
  .from(users)
  .groupBy(users.role)
  .all()

// Count subscriptions by status
const subscriptionCounts = await db
  .select({
    status: subscriptions.status,
    count: sql<number>`count(*)`
  })
  .from(subscriptions)
  .groupBy(subscriptions.status)
  .all()

// Count paid vs trial subscriptions
const paidSubscribers = await db
  .select({ count: sql<number>`count(*)` })
  .from(subscriptions)
  .where(sql`${subscriptions.status} = 'active' AND ${subscriptions.stripeSubscriptionId} IS NOT NULL`)
  .get()

const trialUsers = await db
  .select({ count: sql<number>`count(*)` })
  .from(subscriptions)
  .where(eq(subscriptions.status, 'trialing'))
  .get()

// Total users
const totalUsers = await db
  .select({ count: sql<number>`count(*)` })
  .from(users)
  .get()

console.log('\n📊 User Statistics\n')
console.log('='.repeat(40))

console.log('\n👥 Users by Tier:')
const tierMap = new Map(tierCounts.map(t => [t.tier, t.count]))
console.log(`   Free (Tier 1):  ${tierMap.get(1) || 0}`)
console.log(`   Pro (Tier 2):   ${tierMap.get(2) || 0}`)
console.log(`   ─────────────────`)
console.log(`   Total:          ${totalUsers?.count || 0}`)

console.log('\n🎫 Subscriptions by Status:')
for (const sub of subscriptionCounts) {
  console.log(`   ${(sub.status || 'none').padEnd(12)} ${sub.count}`)
}

console.log('\n💰 Breakdown:')
console.log(`   Paid subscribers:  ${paidSubscribers?.count || 0}`)
console.log(`   Active trials:     ${trialUsers?.count || 0}`)

console.log('\n👑 Users by Role:')
for (const role of roleCounts) {
  console.log(`   ${(role.role || 'user').padEnd(12)} ${role.count}`)
}

console.log('')
