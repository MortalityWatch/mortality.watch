import { randomBytes } from 'node:crypto'
import { db } from './db'
import { inviteCodes, users, subscriptions } from '../../db/schema'
import { eq, and, sql } from 'drizzle-orm'
import type { InviteCode } from '../../db/schema'

/**
 * Invite code utilities for validation, consumption, and generation
 */

/**
 * Generate a random invite code
 *
 * Creates a cryptographically secure random invite code with optional prefix.
 * Format: PREFIX-XXXX-XXXX or XXXX-XXXX (if no prefix)
 * Uses uppercase alphanumeric characters for easy reading and sharing.
 *
 * @param prefix - Optional prefix for the code (e.g., "BETA", "PROMO")
 * @returns Generated invite code string
 *
 * @example
 * generateInviteCode('BETA') // Returns: "BETA-A7K9-M3P2"
 * generateInviteCode()        // Returns: "X4R8-N6Q1"
 */
export function generateInviteCode(prefix?: string): string {
  // Generate 8 random characters (4 bytes = 8 hex chars, convert to base36)
  const randomPart = randomBytes(4)
    .toString('base36')
    .toUpperCase()
    .substring(0, 8)

  // Split into two groups of 4
  const part1 = randomPart.substring(0, 4)
  const part2 = randomPart.substring(4, 8)

  if (prefix) {
    return `${prefix.toUpperCase()}-${part1}-${part2}`
  }

  return `${part1}-${part2}`
}

/**
 * Validate an invite code without consuming it
 *
 * Checks if an invite code is valid (exists, active, not expired, has uses remaining).
 * Does NOT increment the usage counter - use validateAndConsumeInviteCode for that.
 * Useful for UI validation before registration.
 *
 * @param code - The invite code to validate
 * @returns The invite code object if valid, null if invalid
 *
 * @example
 * const code = await validateInviteCode('BETA-2025')
 * if (code) {
 *   console.log(`Code grants tier ${code.grantsTier}`)
 * }
 */
export async function validateInviteCode(
  code: string
): Promise<InviteCode | null> {
  if (!code || code.trim().length === 0) {
    return null
  }

  const normalizedCode = code.trim().toUpperCase()
  const now = new Date()

  try {
    const [inviteCode] = await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, normalizedCode))
      .limit(1)

    if (!inviteCode) {
      return null
    }

    // Check if code is active
    if (!inviteCode.isActive) {
      return null
    }

    // Check if code has expired
    if (inviteCode.expiresAt && inviteCode.expiresAt < now) {
      return null
    }

    // Check if code has uses remaining
    if (inviteCode.currentUses >= inviteCode.maxUses) {
      return null
    }

    return inviteCode
  } catch (error) {
    console.error('Error validating invite code:', error)
    return null
  }
}

/**
 * Validate and consume an invite code
 *
 * Validates the code and increments its usage counter atomically.
 * Should be called during user registration or retroactive code application.
 *
 * @param code - The invite code to validate and consume
 * @returns The invite code object if valid and consumed, null if invalid
 *
 * @example
 * const code = await validateAndConsumeInviteCode('BETA-2025')
 * if (code) {
 *   // Code is valid and has been consumed
 *   await upgradeUserTier(userId, code.grantsTier)
 * }
 */
export async function validateAndConsumeInviteCode(
  code: string
): Promise<InviteCode | null> {
  // First validate the code
  const inviteCode = await validateInviteCode(code)

  if (!inviteCode) {
    return null
  }

  // Increment usage count
  try {
    await incrementInviteCodeUsage(inviteCode.id)
    return inviteCode
  } catch (error) {
    console.error('Error consuming invite code:', error)
    return null
  }
}

/**
 * Increment the usage counter for an invite code
 *
 * Atomically increments the currentUses field for an invite code.
 * Called by validateAndConsumeInviteCode.
 *
 * @param codeId - The ID of the invite code to increment
 *
 * @example
 * await incrementInviteCodeUsage(123)
 */
export async function incrementInviteCodeUsage(codeId: number): Promise<void> {
  await db
    .update(inviteCodes)
    .set({
      currentUses: sql`${inviteCodes.currentUses} + 1`,
      updatedAt: new Date()
    })
    .where(eq(inviteCodes.id, codeId))
}

/**
 * Create a trial subscription for a user
 *
 * Creates a subscription record with "trialing" status for users who
 * register with an invite code that grants time-limited Pro access.
 *
 * @param userId - The user ID to create subscription for
 * @param trialEndDate - When the trial/Pro access expires
 *
 * @example
 * const proUntil = new Date('2025-12-31')
 * await createTrialSubscription(userId, proUntil)
 */
export async function createTrialSubscription(
  userId: number,
  trialEndDate: Date
): Promise<void> {
  await db.insert(subscriptions).values({
    userId,
    status: 'trialing',
    currentPeriodEnd: trialEndDate,
    trialEnd: trialEndDate,
    createdAt: new Date(),
    updatedAt: new Date()
  })
}

/**
 * Apply an invite code to an existing user (retroactive)
 *
 * Allows existing users to apply an invite code after registration.
 * Upgrades their tier to Pro (tier 2) and creates a trial subscription if applicable.
 *
 * @param userId - The user ID to apply code to
 * @param code - The invite code to apply
 * @returns Object with success status and message
 *
 * @example
 * const result = await applyInviteCodeToUser(123, 'BETA-2025')
 * if (result.success) {
 *   console.log(result.message)
 * }
 */
export async function applyInviteCodeToUser(
  userId: number,
  code: string
): Promise<{ success: boolean, message: string }> {
  // Validate and consume the code
  const inviteCode = await validateAndConsumeInviteCode(code)

  if (!inviteCode) {
    return {
      success: false,
      message: 'Invalid or expired invite code'
    }
  }

  try {
    // Get current user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      }
    }

    // Check if user already has Pro access
    if (user.tier >= 2) {
      return {
        success: false,
        message: 'You already have Pro access'
      }
    }

    // Update user tier to Pro and track invite code
    await db
      .update(users)
      .set({
        tier: 2, // All invite codes grant Pro access
        invitedByCodeId: inviteCode.id,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))

    // Create or update trial subscription with time limit
    if (inviteCode.grantsProUntil) {
      // Check if user already has a subscription
      const [existingSubscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1)

      if (!existingSubscription) {
        await createTrialSubscription(userId, inviteCode.grantsProUntil)
      } else {
        // Update existing subscription
        await db
          .update(subscriptions)
          .set({
            status: 'trialing',
            currentPeriodEnd: inviteCode.grantsProUntil,
            trialEnd: inviteCode.grantsProUntil,
            updatedAt: new Date()
          })
          .where(eq(subscriptions.userId, userId))
      }
    }

    return {
      success: true,
      message: `Successfully upgraded to Pro tier${
        inviteCode.grantsProUntil
          ? ` until ${inviteCode.grantsProUntil.toLocaleDateString()}`
          : ''
      }`
    }
  } catch (error) {
    console.error('Error applying invite code to user:', error)
    return {
      success: false,
      message: 'Failed to apply invite code'
    }
  }
}

/**
 * Check and downgrade expired trial subscriptions
 *
 * Checks if a user's trial subscription has expired and downgrades them to tier 1.
 * Called on-demand during authentication (Option A from the plan).
 *
 * @param userId - The user ID to check
 * @returns True if user was downgraded, false otherwise
 *
 * @example
 * await checkAndExpireTrialSubscription(userId)
 */
export async function checkAndExpireTrialSubscription(
  userId: number
): Promise<boolean> {
  try {
    const now = new Date()

    // Get user's subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'trialing')
        )
      )
      .limit(1)

    if (!subscription) {
      return false
    }

    // Check if trial has expired
    if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < now) {
      // Downgrade user to tier 1
      await db
        .update(users)
        .set({
          tier: 1,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))

      // Update subscription status
      await db
        .update(subscriptions)
        .set({
          status: 'inactive',
          updatedAt: new Date()
        })
        .where(eq(subscriptions.userId, userId))

      return true
    }

    return false
  } catch (error) {
    console.error('Error checking trial expiration:', error)
    return false
  }
}
