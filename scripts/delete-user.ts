import { db, users } from '../db'
import { eq } from 'drizzle-orm'

/**
 * Delete a user from the database
 * Usage: npx tsx scripts/delete-user.ts user@example.com
 *
 * ⚠️  This action is irreversible!
 */

const email = process.argv[2]
const forceFlag = process.argv[3]

if (!email) {
  console.error('Usage: npx tsx scripts/delete-user.ts user@example.com [--force]')
  process.exit(1)
}

const user = await db
  .select({ id: users.id, email: users.email, role: users.role, displayName: users.displayName })
  .from(users)
  .where(eq(users.email, email))
  .get()

if (!user) {
  console.error(`❌ User not found: ${email}`)
  process.exit(1)
}

if (forceFlag !== '--force') {
  console.log(`\n⚠️  About to delete user:`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Name: ${user.displayName || 'N/A'}`)
  console.log(`   Role: ${user.role}`)
  console.log(`\nThis action is irreversible!`)
  console.log(`\nTo confirm, run: npx tsx scripts/delete-user.ts ${email} --force`)
  process.exit(1)
}

await db.delete(users).where(eq(users.id, user.id))

console.log(`✅ User deleted: ${email}`)
