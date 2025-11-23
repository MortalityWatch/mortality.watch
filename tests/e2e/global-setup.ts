import { db, users } from '../../db'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

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

  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get()

  const passwordHash = await bcrypt.hash(password, 12)

  if (existingUser) {
    // Update existing user
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
  }
}

export default async function globalSetup() {
  console.log('\n🌱 Seeding test database...')

  for (const userData of seedUsers) {
    await seedUser(userData)
  }

  console.log('✅ Test database seeded successfully!\n')
}
