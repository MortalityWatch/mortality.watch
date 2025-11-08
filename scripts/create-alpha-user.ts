import { db, users, subscriptions } from '../db'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { createTrialSubscription } from '../server/utils/inviteCode'

/**
 * CLI script to create alpha/beta test users with Pro access
 * Usage: npm run create-alpha-user -- --email=test@example.com --pro-until=2025-12-31
 *
 * Arguments:
 *   --email       User email (required)
 *   --password    User password (default: Password1!)
 *   --first-name  First name (default: Alpha)
 *   --last-name   Last name (default: Tester)
 *   --pro-until   Pro access expiry date (YYYY-MM-DD format, required)
 */

interface UserOptions {
  email: string
  password: string
  firstName: string
  lastName: string
  proUntil: string
}

function parseArgs(): UserOptions | null {
  const args = process.argv.slice(2)
  const options: Partial<UserOptions> = {
    password: 'Password1!',
    firstName: 'Alpha',
    lastName: 'Tester'
  }

  for (const arg of args) {
    if (arg.startsWith('--email=')) {
      options.email = arg.substring(8)
    } else if (arg.startsWith('--password=')) {
      options.password = arg.substring(11)
    } else if (arg.startsWith('--first-name=')) {
      options.firstName = arg.substring(13)
    } else if (arg.startsWith('--last-name=')) {
      options.lastName = arg.substring(12)
    } else if (arg.startsWith('--pro-until=')) {
      options.proUntil = arg.substring(12)
    }
  }

  if (!options.email || !options.proUntil) {
    return null
  }

  return options as UserOptions
}

async function createAlphaUser() {
  const options = parseArgs()

  if (!options) {
    console.error('❌ Error: Missing required arguments')
    console.log('\nUsage:')
    console.log('  npm run create-alpha-user -- --email=test@example.com --pro-until=2025-12-31')
    console.log('\nArguments:')
    console.log('  --email       User email (required)')
    console.log('  --password    User password (default: Password1!)')
    console.log('  --first-name  First name (default: Alpha)')
    console.log('  --last-name   Last name (default: Tester)')
    console.log('  --pro-until   Pro expiry date in YYYY-MM-DD format (required)')
    process.exit(1)
  }

  console.log('Creating alpha/beta test user...')
  console.log('='.repeat(50))

  const { email, password, firstName, lastName, proUntil } = options

  // Parse Pro expiry date
  const proUntilDate = new Date(proUntil)
  if (isNaN(proUntilDate.getTime())) {
    console.error('\n❌ Error: Invalid date format for --pro-until')
    console.log('Use YYYY-MM-DD format (e.g., 2025-12-31)')
    process.exit(1)
  }

  console.log(`\nEmail: ${email}`)
  console.log(`Name: ${firstName} ${lastName}`)
  console.log(`Pro access until: ${proUntilDate.toLocaleDateString()}`)

  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email)).get()

  const passwordHash = await bcrypt.hash(password, 12)

  if (existingUser) {
    console.log('\n⚠️  User already exists, updating...')

    // Update user to tier 2 (Pro)
    await db
      .update(users)
      .set({
        tier: 2,
        passwordHash,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        emailVerified: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, existingUser.id))

    // Check if subscription exists
    const existingSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, existingUser.id))
      .get()

    if (existingSubscription) {
      // Update existing subscription
      await db
        .update(subscriptions)
        .set({
          status: 'trialing',
          currentPeriodEnd: proUntilDate,
          trialEnd: proUntilDate,
          updatedAt: new Date()
        })
        .where(eq(subscriptions.userId, existingUser.id))
    } else {
      // Create new subscription
      await createTrialSubscription(existingUser.id, proUntilDate)
    }

    console.log('\n✅ User updated successfully!')
  } else {
    // Create new user
    const newUser = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        tier: 2, // Pro tier
        emailVerified: true
      })
      .returning()
      .get()

    // Create trial subscription
    await createTrialSubscription(newUser.id, proUntilDate)

    console.log('\n✅ User created successfully!')
  }

  console.log('\n' + '='.repeat(50))
  console.log('\n📋 User credentials:')
  console.log(`  Email: ${email}`)
  console.log(`  Password: ${password}`)
  console.log(`  Tier: Pro (tier 2)`)
  console.log(`  Pro expires: ${proUntilDate.toLocaleDateString()}`)
  console.log('\n⚠️  This is a test account for alpha/beta testing only!')
}

createAlphaUser()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })
