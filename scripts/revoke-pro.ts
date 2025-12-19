import { db, users } from '../db'
import { eq } from 'drizzle-orm'

/**
 * Revoke Pro access from a user
 * Usage: npx tsx scripts/revoke-pro.ts user@example.com
 */

const email = process.argv[2]

if (!email) {
  console.error('Usage: npx tsx scripts/revoke-pro.ts user@example.com')
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

if (user.tier !== 2) {
  console.log(`ℹ️  ${email} doesn't have Pro access`)
  process.exit(0)
}

await db
  .update(users)
  .set({ tier: 1, updatedAt: new Date() })
  .where(eq(users.id, user.id))

console.log(`✅ Pro access revoked from ${email}`)
