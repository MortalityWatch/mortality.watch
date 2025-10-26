import { db, users } from '../db'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

/**
 * Seed script to create an admin user
 * Usage: npm run db:seed
 *
 * Set environment variables:
 * - ADMIN_EMAIL (default: admin@mortality.watch)
 * - ADMIN_PASSWORD (default: admin123456)
 * - ADMIN_NAME (default: Admin User)
 */

async function seedAdmin() {
  const email
    = process.env.ADMIN_EMAIL?.toLowerCase() || 'admin@mortality.watch'
  const password = process.env.ADMIN_PASSWORD || 'admin123456'
  const name = process.env.ADMIN_NAME || 'Admin User'

  console.log('Seeding admin user...')
  console.log(`Email: ${email}`)

  // Check if admin already exists
  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get()

  if (existingAdmin) {
    console.log('Admin user already exists, updating...')

    // Update password
    const passwordHash = await bcrypt.hash(password, 12)

    await db
      .update(users)
      .set({
        passwordHash,
        name,
        role: 'admin',
        tier: 2, // Give admin user Pro tier
        emailVerified: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, existingAdmin.id))

    console.log('✅ Admin user updated successfully!')
  } else {
    // Create new admin user
    const passwordHash = await bcrypt.hash(password, 12)

    await db.insert(users).values({
      email,
      passwordHash,
      name,
      role: 'admin',
      tier: 2, // Give admin user Pro tier
      emailVerified: true
    })

    console.log('✅ Admin user created successfully!')
  }

  console.log('\nAdmin credentials:')
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
  console.log('\n⚠️  Please change the password after first login!')
}

seedAdmin()
  .then(() => {
    console.log('\n✅ Seeding completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
