import { z } from 'zod'
import { db, users } from '#db'
import { eq } from 'drizzle-orm'
import {
  hashPassword,
  generateRandomToken,
  hashToken
} from '../../utils/auth'
import { sendVerificationEmail } from '../../utils/email'
import { RegisterResponseSchema } from '../../schemas'
import {
  validateAndConsumeInviteCode,
  createTrialSubscription
} from '../../utils/inviteCode'
import { RequestThrottle } from '../../utils/requestQueue'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
  firstName: z.string().max(50, 'First name is too long').optional().default(''),
  lastName: z.string().max(50, 'Last name is too long').optional().default(''),
  tosAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the Terms of Service and Privacy Policy'
  }),
  inviteCode: z.string().optional() // Optional invite code from URL param
})

// Rate limiting: 5 attempts per hour per IP
const registerRateLimit = new RequestThrottle(
  60 * 60 * 1000, // 1 hour
  5 // 5 attempts
)

export default defineEventHandler(async (event) => {
  // Rate limit by IP address
  const clientIp = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'

  if (!registerRateLimit.check(clientIp)) {
    const retryAfter = registerRateLimit.getSecondsUntilReset(clientIp)
    setResponseHeader(event, 'Retry-After', retryAfter)
    logger.warn(`Rate limit exceeded for register from IP: ${clientIp}`)
    throw createError({
      statusCode: 429,
      message: 'Too many registration attempts. Please try again later.'
    })
  }

  // Parse and validate request body
  const body = await readBody(event)
  const result = registerSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]!.message
    })
  }

  const { email, password, firstName, lastName, tosAccepted, inviteCode } = result.data

  // Verify TOS acceptance (should already be validated by schema, but double-check for security)
  if (!tosAccepted) {
    throw createError({
      statusCode: 400,
      message: 'You must accept the Terms of Service and Privacy Policy to create an account'
    })
  }

  // Validate and consume invite code if provided
  let userTier: 0 | 1 | 2 = 1 // Default tier
  let inviteCodeId: number | null = null
  let proExpiryDate: Date | null = null

  if (inviteCode) {
    const validatedCode = await validateAndConsumeInviteCode(inviteCode)

    if (!validatedCode) {
      throw createError({
        statusCode: 400,
        message: 'Invalid or expired invite code'
      })
    }

    // All invite codes grant Pro access (tier 2)
    userTier = 2
    inviteCodeId = validatedCode.id

    // Track Pro expiry
    if (validatedCode.grantsProUntil) {
      proExpiryDate = validatedCode.grantsProUntil
    }
  }

  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .get()

  if (existingUser) {
    throw createError({
      statusCode: 400,
      message: 'An account with this email already exists'
    })
  }

  // Hash password
  const passwordHash = await hashPassword(password)

  // Generate verification token
  const verificationToken = generateRandomToken()
  const hashedVerificationToken = hashToken(verificationToken)
  const verificationTokenExpires = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ) // 24 hours

  // Create full name for legacy compatibility (empty if no names provided)
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || null

  // Create user with tier from invite code (or default tier 1)
  const newUser = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      name: fullName, // Legacy field for backward compatibility
      role: 'user',
      tier: userTier, // Set tier based on invite code or default to 1
      invitedByCodeId: inviteCodeId, // Track which code was used
      emailVerified: false,
      verificationToken: hashedVerificationToken, // Security: store hashed token
      verificationTokenExpires,
      tosAcceptedAt: new Date() // Store TOS acceptance timestamp for legal compliance
    })
    .returning()
    .get()

  // If invite code grants Pro access with expiry, create trial subscription
  if (proExpiryDate) {
    await createTrialSubscription(newUser.id, proExpiryDate)
  }

  // Send verification email with unhashed token - await to ensure it succeeds
  // Note: Auth token is not generated until email is verified
  try {
    await sendVerificationEmail(newUser.email, verificationToken)
  } catch (error) {
    logger.error('Failed to send verification email:', error instanceof Error ? error : new Error(String(error)))
    // User is created but can use resend functionality from check-email page
    // Still return success so they get to check-email page
  }

  // Return user without password hash
  const { passwordHash: _passwordHash, ...userWithoutPassword } = newUser

  const response = {
    success: true as const,
    user: userWithoutPassword,
    message: 'Account created successfully. Please check your email to verify your account.',
    requiresVerification: true
  }
  return RegisterResponseSchema.parse(response)
})
