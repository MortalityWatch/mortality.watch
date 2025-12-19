import { db, users } from '../db'
import { eq } from 'drizzle-orm'

/**
 * Demote an admin to regular user
 * Usage: npx tsx scripts/demote-admin.ts user@example.com
 */

const email = process.argv[2]

if (!email) {
  console.error('Usage: npx tsx scripts/demote-admin.ts user@example.com')
  process.exit(1)
}

const user = await db
  .select({ id: users.id, email: users.email, role: users.role })
  .from(users)
  .where(eq(users.email, email))
  .get()

if (!user) {
  console.error(`❌ User not found: ${email}`)
  process.exit(1)
}

if (user.role === 'user') {
  console.log(`ℹ️  ${email} is already a regular user`)
  process.exit(0)
}

await db
  .update(users)
  .set({ role: 'user', updatedAt: new Date() })
  .where(eq(users.id, user.id))

console.log(`✅ ${email} demoted to regular user`)
