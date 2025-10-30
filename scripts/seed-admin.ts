import { db, users } from '../db'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

/**
 * Seed script to create test users
 * Usage: npm run db:seed
 *
 * Creates three users:
 * - admin@mortality.watch - Admin + Pro (tier 2)
 * - pro@mortality.watch - Pro user (tier 2)
 * - free@mortality.watch - Free user (tier 1)
 *
 * All users have password: Password1!
 */

interface UserSeed {
  email: string
  password: string
  firstName: string
  lastName: string
  displayName: string
  role: 'admin' | 'user'
  tier: number
}

const seedUsers: UserSeed[] = [
  {
    email: 'admin@mortality.watch',
    password: 'Password1!',
    firstName: 'Admin',
    lastName: 'User',
    displayName: 'Admin',
    role: 'admin',
    tier: 2
  },
  {
    email: 'pro@mortality.watch',
    password: 'Password1!',
    firstName: 'Pro',
    lastName: 'User',
    displayName: 'Pro',
    role: 'user',
    tier: 2
  },
  {
    email: 'free@mortality.watch',
    password: 'Password1!',
    firstName: 'Free',
    lastName: 'User',
    displayName: 'Free',
    role: 'user',
    tier: 1
  }
]

async function seedUser(userData: UserSeed) {
  const { email, password, firstName, lastName, displayName, role, tier } = userData

  console.log(`\nSeeding user: ${email}`)

  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get()

  const passwordHash = await bcrypt.hash(password, 12)

  if (existingUser) {
    console.log('  User already exists, updating...')

    await db
      .update(users)
      .set({
        passwordHash,
        firstName,
        lastName,
        displayName,
        role,
        tier,
        emailVerified: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, existingUser.id))

    console.log(`  ✅ ${email} updated successfully!`)
  } else {
    // Create new user
    await db.insert(users).values({
      email,
      passwordHash,
      firstName,
      lastName,
      displayName,
      role,
      tier,
      emailVerified: true
    })

    console.log(`  ✅ ${email} created successfully!`)
  }
}

async function seedAllUsers() {
  console.log('Seeding test users...')
  console.log('='.repeat(50))

  for (const userData of seedUsers) {
    await seedUser(userData)
  }

  console.log('\n' + '='.repeat(50))
  console.log('\n📋 Test user credentials:')
  console.log('\nAdmin + Pro (tier 2):')
  console.log('  Email: admin@mortality.watch')
  console.log('  Password: Password1!')
  console.log('\nPro user (tier 2):')
  console.log('  Email: pro@mortality.watch')
  console.log('  Password: Password1!')
  console.log('\nFree user (tier 1):')
  console.log('  Email: free@mortality.watch')
  console.log('  Password: Password1!')
  console.log('\n⚠️  These are test credentials for development/staging only!')
}

seedAllUsers()
  .then(() => {
    console.log('\n✅ Seeding completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
