import { db, inviteCodes } from '../db'
import { generateInviteCode } from '../server/utils/inviteCode'

/**
 * CLI script to create invite codes
 * Usage: npm run create-invite-code -- --code=BETA-2025 --max-uses=10 --pro-months=6
 *
 * Arguments:
 *   --code         Code string (optional, auto-generated if not provided)
 *   --prefix       Prefix for auto-generated code (optional)
 *   --max-uses     Maximum number of uses (default: 1)
 *   --pro-months   Duration of Pro access in months (optional)
 *   --expires-days Days until code expires (optional)
 *   --notes        Notes about this code (optional)
 */

interface CodeOptions {
  code?: string
  prefix?: string
  maxUses: number
  proMonths?: number
  expiresDays?: number
  notes?: string
}

function parseArgs(): CodeOptions {
  const args = process.argv.slice(2)
  const options: CodeOptions = {
    maxUses: 1
  }

  for (const arg of args) {
    if (arg.startsWith('--code=')) {
      options.code = arg.substring(7)
    } else if (arg.startsWith('--prefix=')) {
      options.prefix = arg.substring(9)
    } else if (arg.startsWith('--max-uses=')) {
      options.maxUses = parseInt(arg.substring(11))
    } else if (arg.startsWith('--pro-months=')) {
      options.proMonths = parseInt(arg.substring(13))
    } else if (arg.startsWith('--expires-days=')) {
      options.expiresDays = parseInt(arg.substring(15))
    } else if (arg.startsWith('--notes=')) {
      options.notes = arg.substring(8)
    }
  }

  return options
}

async function createInviteCode() {
  const options = parseArgs()

  console.log('Creating invite code...')
  console.log('='.repeat(50))

  // Generate code if not provided
  const code = options.code
    ? options.code.toUpperCase()
    : generateInviteCode(options.prefix)

  console.log(`\nCode: ${code}`)
  console.log(`Max uses: ${options.maxUses}`)

  // Calculate Pro expiry date
  let grantsProUntil: Date | null = null
  if (options.proMonths) {
    grantsProUntil = new Date()
    grantsProUntil.setMonth(grantsProUntil.getMonth() + options.proMonths)
    console.log(
      `Grants Pro until: ${grantsProUntil.toLocaleDateString()} (${options.proMonths} months)`
    )
  }

  // Calculate code expiry date
  let expiresAt: Date | null = null
  if (options.expiresDays) {
    expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + options.expiresDays)
    console.log(
      `Code expires: ${expiresAt.toLocaleDateString()} (${options.expiresDays} days)`
    )
  }

  if (options.notes) {
    console.log(`Notes: ${options.notes}`)
  }

  // Create the invite code
  try {
    const newCode = await db
      .insert(inviteCodes)
      .values({
        code,
        maxUses: options.maxUses,
        grantsProUntil,
        expiresAt,
        notes: options.notes || null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()
      .get()

    console.log('\n' + '='.repeat(50))
    console.log('\n✅ Invite code created successfully!')
    console.log(`\nID: ${newCode.id}`)
    console.log(`Code: ${newCode.code}`)
    console.log(`Max uses: ${newCode.maxUses}`)
    console.log(`Current uses: ${newCode.currentUses}`)
    if (newCode.grantsProUntil) {
      console.log(`Grants Pro until: ${newCode.grantsProUntil.toLocaleDateString()}`)
    }
    if (newCode.expiresAt) {
      console.log(`Expires at: ${newCode.expiresAt.toLocaleDateString()}`)
    }
    console.log(`\n🔗 Signup URL: https://mortality.watch/signup?code=${newCode.code}`)
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      console.error('\n❌ Error: A code with this name already exists')
    } else {
      console.error('\n❌ Error creating invite code:', error)
    }
    process.exit(1)
  }
}

createInviteCode()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })
