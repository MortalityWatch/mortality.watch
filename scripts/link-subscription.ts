import Stripe from 'stripe'
import { db, users, subscriptions } from '../db'
import { eq } from 'drizzle-orm'

/**
 * Link a Stripe subscription to a user (for when webhook fails)
 * Usage: npx tsx scripts/link-subscription.ts user@example.com sub_xxxxx
 */

const email = process.argv[2]
const stripeSubscriptionId = process.argv[3]

if (!email || !stripeSubscriptionId) {
  console.error('Usage: npx tsx scripts/link-subscription.ts user@example.com sub_xxxxx')
  process.exit(1)
}

if (!stripeSubscriptionId.startsWith('sub_')) {
  console.error('❌ Invalid subscription ID. Must start with "sub_"')
  process.exit(1)
}

// Check Stripe API key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY environment variable not set')
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

console.log(`\nUser: ${user.email} (ID: ${user.id})`)

// Fetch subscription from Stripe
const stripe = new Stripe(stripeSecretKey)
let stripeSubscription: Stripe.Subscription

try {
  stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
} catch (error) {
  console.error(`❌ Failed to fetch subscription from Stripe: ${error}`)
  process.exit(1)
}

console.log(`\nStripe Subscription:`)
console.log(`  ID: ${stripeSubscription.id}`)
console.log(`  Status: ${stripeSubscription.status}`)
console.log(`  Customer: ${stripeSubscription.customer}`)

// Get customer ID
const customerId = typeof stripeSubscription.customer === 'string'
  ? stripeSubscription.customer
  : stripeSubscription.customer.id

// Access with snake_case
const sub = stripeSubscription as unknown as {
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
  canceled_at: number | null
  trial_end: number | null
}

// Determine plan
const priceId = stripeSubscription.items.data[0]?.price.id
let plan: 'monthly' | 'yearly' | null = null
if (priceId === process.env.STRIPE_PRICE_MONTHLY) {
  plan = 'monthly'
} else if (priceId === process.env.STRIPE_PRICE_YEARLY) {
  plan = 'yearly'
} else {
  // Try to infer from interval
  const interval = stripeSubscription.items.data[0]?.price.recurring?.interval
  plan = interval === 'year' ? 'yearly' : 'monthly'
}

console.log(`  Plan: ${plan}`)

// Check for existing subscription
const existingSubscription = await db
  .select()
  .from(subscriptions)
  .where(eq(subscriptions.userId, user.id))
  .get()

const subscriptionData = {
  userId: user.id,
  stripeCustomerId: customerId,
  stripeSubscriptionId: stripeSubscription.id,
  status: stripeSubscription.status as 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'trialing' | 'inactive',
  plan,
  planPriceId: priceId || null,
  currentPeriodStart: new Date(sub.current_period_start * 1000),
  currentPeriodEnd: new Date(sub.current_period_end * 1000),
  cancelAtPeriodEnd: sub.cancel_at_period_end || false,
  canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
  trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
  updatedAt: new Date()
}

if (existingSubscription) {
  console.log(`\nUpdating existing subscription...`)
  await db
    .update(subscriptions)
    .set(subscriptionData)
    .where(eq(subscriptions.userId, user.id))
} else {
  console.log(`\nCreating new subscription...`)
  await db.insert(subscriptions).values(subscriptionData)
}

// Update user tier
const tier = stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing' ? 2 : 1
await db.update(users).set({ tier }).where(eq(users.id, user.id))

console.log(`\n✅ Subscription linked successfully!`)
console.log(`   User tier updated to: ${tier}`)
