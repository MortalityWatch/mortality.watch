import { db } from '../db'
import { users } from '../db/schema'
import bcrypt from 'bcryptjs'

const TEST_USER = {
  email: 'pro@mortality.watch',
  password: 'Password1!',
  name: 'Test User'
}

async function seed() {
  console.log('Seeding test user...')

  const hashedPassword = await bcrypt.hash(TEST_USER.password, 10)

  await db.insert(users).values({
    email: TEST_USER.email,
    passwordHash: hashedPassword,
    name: TEST_USER.name,
    emailVerified: true
  }).onConflictDoNothing()

  console.log(`Test user created: ${TEST_USER.email}`)
}

seed()
  .then(() => {
    console.log('Seed completed successfully')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
