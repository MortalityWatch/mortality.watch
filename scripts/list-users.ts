import { db, users } from '../db'

/**
 * List all users in the database
 * Usage: npx tsx scripts/list-users.ts
 */

const allUsers = await db
  .select({
    id: users.id,
    email: users.email,
    displayName: users.displayName,
    role: users.role,
    tier: users.tier,
    createdAt: users.createdAt
  })
  .from(users)
  .all()

if (allUsers.length === 0) {
  console.log('No users found')
  process.exit(0)
}

console.log(`\nFound ${allUsers.length} user(s):\n`)
console.log('ID\tRole\tTier\tEmail\t\t\t\tName\t\tCreated')
console.log('-'.repeat(90))

for (const user of allUsers) {
  const created = user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : 'N/A'
  console.log(`${user.id}\t${user.role}\t${user.tier}\t${user.email.padEnd(28)}\t${(user.displayName || '').padEnd(12)}\t${created}`)
}
