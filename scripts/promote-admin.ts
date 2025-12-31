import { db, users } from '../db'
import { eq } from 'drizzle-orm'

/**
 * Promote a user to admin role
 * Usage: npx tsx scripts/promote-admin.ts user@example.com
 */

const email = process.argv[2]

if (!email) {
  console.error('Usage: npx tsx scripts/promote-admin.ts user@example.com')
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

if (user.role === 'admin') {
  console.log(`ℹ️  ${email} is already an admin`)
  process.exit(0)
}

await db
  .update(users)
  .set({ role: 'admin', tier: 2, updatedAt: new Date() })
  .where(eq(users.id, user.id))

console.log(`✅ ${email} promoted to admin with Pro tier`)
