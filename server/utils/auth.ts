import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import { db, users } from '#db'
import { eq } from 'drizzle-orm'

/**
 * JWT payload interface
 */
interface JwtPayload {
  userId: number
  email: string
  tier: number
  role: string
}

/**
 * Get JWT secret from environment or use default for development
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
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

/**
 * Generate a JWT token for a user
 * @param payload - User data to encode
 * @param expiresIn - Token expiry (default: 7 days, with remember: 90 days)
 */
export function generateToken(payload: JwtPayload, expiresIn: string | number = '7d'): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn
  } as jwt.SignOptions)
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload
  } catch {
    return null
  }
}

/**
 * Get the current user from the request event
 * Checks for JWT token in cookies or Authorization header
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
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.userId))
    .get()

  if (!user) {
    return null
  }

  // Return user without password hash
  const { passwordHash: _passwordHash, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * Require authentication - throws error if not authenticated
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
 * Require specific tier - throws error if user tier is below required
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
 * Generate a cryptographically secure random token for email verification or password reset
 * @returns A 64-character hex string (32 bytes)
 */
export function generateRandomToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Set auth token cookie
 * @param maxAge - Cookie expiry in seconds (default: 7 days, with remember: 90 days)
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
 * Clear auth token cookie
 */
export function clearAuthToken(event: H3Event) {
  deleteCookie(event, 'auth_token')
}
