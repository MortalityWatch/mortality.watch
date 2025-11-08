import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import { db, users } from '#db'
import { eq } from 'drizzle-orm'

/**
 * JWT payload interface
 *
 * Defines the structure of data encoded in JWT tokens.
 * This payload is signed and verified but NOT encrypted,
 * so it should not contain sensitive information.
 *
 * @property {number} userId - Database user ID (primary key)
 * @property {string} email - User's email address
 * @property {number} tier - User's subscription tier (0=free, 1=basic, 2=premium)
 * @property {string} role - User's role ('user' or 'admin')
 */
interface JwtPayload {
  userId: number
  email: string
  tier: number
  role: string
}

/**
 * Get JWT secret from environment or use default for development
 *
 * Retrieves the secret key used for signing and verifying JWT tokens.
 * In production, this MUST be set via the JWT_SECRET environment variable.
 * In development, a default key is provided for convenience.
 *
 * **Security Considerations:**
 * - Production environments MUST set JWT_SECRET
 * - Secret should be cryptographically random (min 256 bits)
 * - Never commit secrets to version control
 * - Rotate secrets if compromised
 *
 * **Error Handling:**
 * - Throws error if JWT_SECRET missing in production
 * - Allows fallback to default in development only
 *
 * @returns {string} The JWT secret key
 * @throws {Error} If JWT_SECRET is not set in production
 *
 * @example
 * ```typescript
 * // Production (environment variable required)
 * process.env.JWT_SECRET = 'your-256-bit-secret'
 * const secret = getJwtSecret() // Returns environment secret
 * ```
 *
 * @example
 * ```typescript
 * // Development (fallback allowed)
 * process.env.NODE_ENV = 'development'
 * const secret = getJwtSecret() // Returns default development secret
 * ```
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production')
  }
  return secret || 'development-secret-key-change-in-production'
}

/**
 * Hash a password using bcrypt
 *
 * Creates a secure, one-way hash of a password using bcrypt with
 * a cost factor of 12 (2^12 iterations). This hash can be safely
 * stored in the database and used for password verification.
 *
 * **Security Considerations:**
 * - Uses bcrypt's adaptive hashing algorithm
 * - Cost factor of 12 provides strong security vs. brute force
 * - Each hash includes a random salt (automatic with bcrypt)
 * - Hashing is intentionally slow to prevent brute force attacks
 *
 * **Performance Notes:**
 * - Hashing takes ~200-300ms on modern hardware (intentional)
 * - Higher cost = more secure but slower
 * - Cost factor of 12 is recommended as of 2024
 *
 * **Error Handling:**
 * - Throws if password is empty or invalid
 * - Async operation may fail on system resource issues
 *
 * @param {string} password - Plain text password to hash
 * @returns {Promise<string>} Bcrypt hash (60 character string)
 *
 * @example
 * ```typescript
 * const hash = await hashPassword('user-password-123')
 * // Returns: '$2a$12$...' (60 characters)
 * // Store this hash in database, never the plain password
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

/**
 * Verify a password against a bcrypt hash
 *
 * Securely compares a plain text password against a bcrypt hash.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * **Security Considerations:**
 * - Uses bcrypt.compare() which is timing-attack resistant
 * - Never compare passwords using === (timing attack vulnerable)
 * - Hash contains salt and cost factor, so same password produces different hashes
 *
 * **Performance Notes:**
 * - Takes ~200-300ms (same as hashing, intentional for security)
 * - Prevents rapid brute force attempts
 *
 * **Error Handling:**
 * - Returns false for invalid hash format
 * - Returns false for empty/invalid inputs
 * - Does not throw on verification failure (returns false instead)
 *
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Bcrypt hash from database (60 characters)
 * @returns {Promise<boolean>} True if password matches, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = await verifyPassword('user-password-123', storedHash)
 * if (isValid) {
 *   // Password correct, proceed with login
 * } else {
 *   // Password incorrect, reject login
 * }
 * ```
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

/**
 * Generate a JWT token for a user
 *
 * Creates a signed JSON Web Token containing user information.
 * The token is signed but NOT encrypted - do not include sensitive data.
 *
 * **Token Expiration:**
 * - Default: 7 days ('7d')
 * - "Remember me": 90 days ('90d')
 * - Can be configured per-token
 *
 * **Security Considerations:**
 * - Token is signed to prevent tampering
 * - Token is NOT encrypted (readable by anyone)
 * - Only include non-sensitive user identifiers
 * - Token cannot be revoked before expiry (use short expiry times)
 * - Verify token on every request (see verifyToken)
 *
 * **Token Contents:**
 * - Header: Algorithm and token type
 * - Payload: User data (userId, email, tier, role)
 * - Signature: Ensures token hasn't been modified
 *
 * @param {JwtPayload} payload - User data to encode in token
 * @param {string | number} [expiresIn='7d'] - Token expiry time (e.g., '7d', '90d', 3600)
 * @returns {string} Signed JWT token string
 *
 * @example
 * ```typescript
 * const token = generateToken({
 *   userId: 123,
 *   email: 'user@example.com',
 *   tier: 1,
 *   role: 'user'
 * })
 * // Returns: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 * ```
 *
 * @example
 * ```typescript
 * // Extended expiry for "remember me"
 * const longToken = generateToken(userPayload, '90d')
 * ```
 */
export function generateToken(payload: JwtPayload, expiresIn: string | number = '7d'): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn
  } as jwt.SignOptions)
}

/**
 * Verify and decode a JWT token
 *
 * Validates a JWT token's signature and expiration, then decodes its payload.
 * Returns null if token is invalid, expired, or tampered with.
 *
 * **Verification Steps:**
 * 1. Check signature matches (prevents tampering)
 * 2. Check token hasn't expired
 * 3. Check token format is valid
 * 4. Decode and return payload
 *
 * **Security Considerations:**
 * - Always verify tokens before trusting their contents
 * - Signature verification prevents token forgery
 * - Expiration check prevents replay of old tokens
 * - Returns null on ANY failure (fail-safe design)
 *
 * **Common Failure Scenarios:**
 * - Token expired (exp claim in past)
 * - Token signature invalid (tampering detected)
 * - Token format malformed
 * - Secret key mismatch
 *
 * @param {string} token - JWT token string to verify
 * @returns {JwtPayload | null} Decoded payload if valid, null if invalid/expired
 *
 * @example
 * ```typescript
 * const payload = verifyToken(tokenFromClient)
 * if (payload) {
 *   console.log(`Authenticated user: ${payload.userId}`)
 * } else {
 *   console.log('Invalid or expired token')
 * }
 * ```
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload
  } catch {
    return null
  }
}

/**
 * Get the current authenticated user from the request
 *
 * Extracts and verifies JWT token from cookies or Authorization header,
 * then retrieves the full user record from the database.
 *
 * **Token Location Priority:**
 * 1. 'auth_token' cookie (preferred for web browsers)
 * 2. 'Authorization: Bearer <token>' header (for API clients)
 *
 * **Verification Process:**
 * 1. Extract token from cookie or header
 * 2. Verify token signature and expiration
 * 3. Look up user in database by userId from token
 * 4. Return user without password hash
 *
 * **Security Considerations:**
 * - Password hash is explicitly removed from response
 * - Returns null if any step fails (fail-safe)
 * - Validates user still exists in database (handles deletions)
 * - Does NOT throw errors (use requireAuth for that)
 *
 * **Use Cases:**
 * - Optional authentication (check if user is logged in)
 * - Middleware that needs user info but doesn't require it
 * - Public endpoints that customize based on auth status
 *
 * @param {H3Event} event - H3 request event object
 * @returns {Promise<object | null>} User object without password, or null if not authenticated
 *
 * @example
 * ```typescript
 * export default defineEventHandler(async (event) => {
 *   const user = await getCurrentUser(event)
 *   if (user) {
 *     return { message: `Hello, ${user.email}` }
 *   }
 *   return { message: 'Hello, guest' }
 * })
 * ```
 */
export async function getCurrentUser(event: H3Event) {
  // Try to get token from cookie
  let token = getCookie(event, 'auth_token')

  // If not in cookie, try Authorization header
  if (!token) {
    const authHeader = getHeader(event, 'authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
  }

  if (!token) {
    return null
  }

  // Verify token
  const payload = verifyToken(token)
  if (!payload) {
    return null
  }

  // Get user from database
  let user = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.userId))
    .get()

  if (!user) {
    return null
  }

  // Check and expire trial subscriptions on-demand
  try {
    const { checkAndExpireTrialSubscription } = await import('./inviteCode')
    const wasDowngraded = await checkAndExpireTrialSubscription(user.id)

    // If user was downgraded, fetch fresh user data to get updated tier
    if (wasDowngraded) {
      user = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .get()

      if (!user) {
        return null
      }
    }
  } catch (error) {
    // Log error but don't block authentication
    console.error('Error checking trial expiration:', error)
  }

  // Return user without password hash
  const { passwordHash: _passwordHash, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * Require authentication - throws error if not authenticated
 *
 * Enforces that a request must be authenticated. If the user is not
 * authenticated, throws a 401 Unauthorized error.
 *
 * **Use Cases:**
 * - Protected API endpoints
 * - User-specific operations
 * - Any route requiring authentication
 *
 * **Error Response:**
 * - Status: 401 Unauthorized
 * - Message: 'Unauthorized - please sign in'
 * - Response stops here (handler does not continue)
 *
 * **Security Considerations:**
 * - Always use this for protected endpoints
 * - User is fully verified (token + database lookup)
 * - Password hash removed from returned user object
 *
 * @param {H3Event} event - H3 request event object
 * @returns {Promise<object>} Authenticated user object (without password)
 * @throws {H3Error} 401 error if not authenticated
 *
 * @example
 * ```typescript
 * export default defineEventHandler(async (event) => {
 *   const user = await requireAuth(event)
 *   // If we reach here, user is authenticated
 *   return { userId: user.id, email: user.email }
 * })
 * ```
 */
export async function requireAuth(event: H3Event) {
  const user = await getCurrentUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized - please sign in'
    })
  }
  return user
}

/**
 * Require admin role - throws error if not admin
 *
 * Enforces that a request must be authenticated AND have admin role.
 * First checks authentication (like requireAuth), then checks role.
 *
 * **Use Cases:**
 * - Admin-only API endpoints
 * - Data quality management
 * - User management operations
 * - System configuration
 *
 * **Error Responses:**
 * - Status: 401 if not authenticated
 * - Status: 403 if authenticated but not admin
 * - Message: 'Forbidden - admin access required'
 *
 * **Security Considerations:**
 * - Two-step verification (auth + role)
 * - Role stored in database, not just in token
 * - Cannot be bypassed by forging token (role verified in DB)
 *
 * @param {H3Event} event - H3 request event object
 * @returns {Promise<object>} Authenticated admin user object
 * @throws {H3Error} 401 if not authenticated, 403 if not admin
 *
 * @example
 * ```typescript
 * export default defineEventHandler(async (event) => {
 *   const admin = await requireAdmin(event)
 *   // If we reach here, user is admin
 *   return await performAdminOperation()
 * })
 * ```
 */
export async function requireAdmin(event: H3Event) {
  const user = await requireAuth(event)
  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden - admin access required'
    })
  }
  return user
}

/**
 * Require specific subscription tier - throws error if user tier is below required
 *
 * Enforces minimum subscription tier for accessing premium features.
 * First checks authentication, then checks tier level.
 *
 * **Tier Levels:**
 * - 0: Free tier (all users)
 * - 1: Basic paid tier
 * - 2: Premium paid tier
 *
 * **Use Cases:**
 * - Premium data exports
 * - Advanced chart features
 * - High-volume API access
 * - Tier-gated functionality
 *
 * **Error Responses:**
 * - Status: 401 if not authenticated
 * - Status: 403 if tier too low
 * - Message: 'Forbidden - tier X access required'
 *
 * **Security Considerations:**
 * - Tier stored in database, not just token
 * - Cannot be bypassed by forging token
 * - User must authenticate first
 *
 * @param {H3Event} event - H3 request event object
 * @param {0 | 1 | 2} requiredTier - Minimum tier required (0=free, 1=basic, 2=premium)
 * @returns {Promise<object>} Authenticated user object with sufficient tier
 * @throws {H3Error} 401 if not authenticated, 403 if tier too low
 *
 * @example
 * ```typescript
 * export default defineEventHandler(async (event) => {
 *   const user = await requireTier(event, 2) // Requires premium
 *   return await exportPremiumData()
 * })
 * ```
 */
export async function requireTier(event: H3Event, requiredTier: 0 | 1 | 2) {
  const user = await requireAuth(event)
  if (user.tier < requiredTier) {
    throw createError({
      statusCode: 403,
      message: `Forbidden - tier ${requiredTier} access required`
    })
  }
  return user
}

/**
 * Generate a cryptographically secure random token
 *
 * Creates a random token suitable for email verification, password reset,
 * or other security-sensitive operations. Uses Node's crypto.randomBytes
 * for cryptographic quality randomness.
 *
 * **Token Properties:**
 * - 32 bytes of random data
 * - Encoded as 64-character hex string
 * - Cryptographically secure (not pseudo-random)
 * - Suitable for security-critical uses
 *
 * **Use Cases:**
 * - Email verification tokens
 * - Password reset tokens
 * - Account activation links
 * - One-time use secrets
 *
 * **Security Considerations:**
 * - Uses crypto.randomBytes (NOT Math.random)
 * - Sufficient entropy for security tokens
 * - Should be stored hashed in database
 * - Should have expiration time (e.g., 1 hour)
 * - Should be single-use only
 *
 * **Best Practices:**
 * - Hash token before storing in database
 * - Set expiration time (e.g., 1-24 hours)
 * - Invalidate after use
 * - Send via secure channel only (HTTPS, encrypted email)
 *
 * @returns {string} 64-character hexadecimal string (32 bytes)
 *
 * @example
 * ```typescript
 * const resetToken = generateRandomToken()
 * // Returns: '3a7c9f2b1e4d8a6c...' (64 characters)
 *
 * // Store hashed version in database
 * const hashedToken = await hashPassword(resetToken)
 * await db.update(users)
 *   .set({
 *     resetToken: hashedToken,
 *     resetTokenExpiry: Date.now() + 3600000 // 1 hour
 *   })
 *
 * // Send unhashed version to user (once only)
 * await sendPasswordResetEmail(email, resetToken)
 * ```
 */
export function generateRandomToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Set authentication token cookie
 *
 * Sets a secure HTTP-only cookie containing the JWT token.
 * This is the primary authentication mechanism for web browsers.
 *
 * **Cookie Configuration:**
 * - httpOnly: true (JavaScript cannot access, XSS protection)
 * - secure: true in production (HTTPS only)
 * - sameSite: 'lax' (CSRF protection)
 * - path: '/' (available site-wide)
 * - maxAge: 7 days default, 90 days for "remember me"
 *
 * **Security Considerations:**
 * - httpOnly prevents XSS token theft
 * - secure flag prevents MITM attacks (production only)
 * - sameSite prevents CSRF attacks
 * - maxAge ensures token expires
 * - Token itself should also have expiration (see generateToken)
 *
 * **Cookie vs. LocalStorage:**
 * - Cookies: More secure (httpOnly), sent automatically
 * - LocalStorage: Vulnerable to XSS, requires manual handling
 * - This implementation uses cookies for better security
 *
 * @param {H3Event} event - H3 request event object
 * @param {string} token - JWT token to store in cookie
 * @param {number} [maxAge=604800] - Cookie expiry in seconds (default: 7 days)
 *
 * @example
 * ```typescript
 * // Standard login (7 days)
 * const token = generateToken(userPayload)
 * setAuthToken(event, token)
 * ```
 *
 * @example
 * ```typescript
 * // "Remember me" login (90 days)
 * const token = generateToken(userPayload, '90d')
 * setAuthToken(event, token, 60 * 60 * 24 * 90)
 * ```
 */
export function setAuthToken(event: H3Event, token: string, maxAge: number = 60 * 60 * 24 * 7) {
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/'
  })
}

/**
 * Clear authentication token cookie
 *
 * Removes the auth_token cookie, effectively logging out the user.
 * This is used during logout and when invalidating sessions.
 *
 * **Use Cases:**
 * - User logout
 * - Session invalidation
 * - Security-forced logout (e.g., after password change)
 * - Token revocation
 *
 * **Security Considerations:**
 * - Client-side only (does not invalidate token on server)
 * - Token remains valid until expiration if attacker has copy
 * - For sensitive operations, also invalidate token server-side
 * - Consider implementing token blacklist for immediate revocation
 *
 * **Limitations:**
 * - Does not prevent use of token if attacker copied it
 * - Token still valid if sent via Authorization header
 * - For complete logout, may need server-side token blacklist
 *
 * **Best Practices:**
 * - Always clear cookie on logout
 * - Redirect to login page after clearing
 * - Consider updating "last logout" timestamp in database
 * - For high-security apps, implement token blacklist
 *
 * @param {H3Event} event - H3 request event object
 *
 * @example
 * ```typescript
 * // Logout endpoint
 * export default defineEventHandler(async (event) => {
 *   clearAuthToken(event)
 *   return { message: 'Logged out successfully' }
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Password change (force re-authentication)
 * export default defineEventHandler(async (event) => {
 *   await updateUserPassword(userId, newPassword)
 *   clearAuthToken(event)
 *   return { message: 'Password updated, please sign in again' }
 * })
 * ```
 */
export function clearAuthToken(event: H3Event) {
  deleteCookie(event, 'auth_token')
}
