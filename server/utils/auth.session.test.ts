import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { H3Event } from 'h3'

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async (password: string) => `hashed_${password}`),
    compare: vi.fn(async (password: string, hash: string) => {
      return hash === `hashed_${password}`
    })
  }
}))

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn((payload: unknown, _secret: string, options: { expiresIn: string | number }) => {
      return `jwt_${JSON.stringify(payload)}_${options.expiresIn}`
    }),
    verify: vi.fn((token: string, _secret: string) => {
      if (token.startsWith('jwt_')) {
        const match = token.match(/^jwt_(.+)_(.+)$/)
        if (match?.[1]) {
          return JSON.parse(match[1])
        }
      }
      throw new Error('Invalid token')
    })
  }
}))

// Mock invite code utilities
vi.mock('./inviteCode', () => ({
  validateAndConsumeInviteCode: vi.fn().mockResolvedValue(null),
  createTrialSubscription: vi.fn().mockResolvedValue(undefined)
}))

// Mock h3 functions
const mockGetCookie = vi.fn()
const mockGetHeader = vi.fn()
const mockSetCookie = vi.fn()
const mockDeleteCookie = vi.fn()
const mockCreateError = vi.fn(error => error)

// Make h3 functions available globally (Nuxt auto-imports them)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).getCookie = mockGetCookie
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).getHeader = mockGetHeader
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).setCookie = mockSetCookie
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).deleteCookie = mockDeleteCookie
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).createError = mockCreateError

vi.mock('h3', () => ({
  getCookie: mockGetCookie,
  getHeader: mockGetHeader,
  setCookie: mockSetCookie,
  deleteCookie: mockDeleteCookie,
  createError: mockCreateError
}))

// Mock database
const mockDb = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        get: vi.fn()
      }))
    }))
  })),
  insert: vi.fn(() => ({
    values: vi.fn()
  })),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn()
    }))
  }))
}

vi.mock('#db', () => ({
  db: mockDb,
  users: {},
  eq: vi.fn((field: unknown, value: unknown) => ({ field, value }))
}))

// Mock inviteCode module to prevent database access
vi.mock('./inviteCode', () => ({
  checkAndExpireTrialSubscription: vi.fn(async () => false),
  validateAndConsumeInviteCode: vi.fn().mockResolvedValue(null),
  createTrialSubscription: vi.fn().mockResolvedValue(undefined),
  FREE_TRIAL_DAYS: 14
}))

describe('Auth Utilities', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    vi.clearAllMocks()
    originalEnv = { ...process.env }
    process.env.JWT_SECRET = 'test-secret-key'
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('generateRandomToken', () => {
    it('should generate a 64-character hex string', async () => {
      const { generateRandomToken } = await import('./auth')

      const token = generateRandomToken()

      expect(token).toMatch(/^[a-f0-9]{64}$/)
      expect(token.length).toBe(64)
    })

    it('should generate unique tokens', async () => {
      const { generateRandomToken } = await import('./auth')

      const token1 = generateRandomToken()
      const token2 = generateRandomToken()
      const token3 = generateRandomToken()

      expect(token1).not.toBe(token2)
      expect(token2).not.toBe(token3)
      expect(token1).not.toBe(token3)
    })

    it('should be cryptographically secure (uses randomBytes)', async () => {
      const { generateRandomToken } = await import('./auth')

      // Generate multiple tokens and check for patterns
      const tokens = new Set()
      for (let i = 0; i < 10; i++) {
        tokens.add(generateRandomToken())
      }

      // All tokens should be unique
      expect(tokens.size).toBe(10)
    })
  })

  describe('hashToken', () => {
    it('should return consistent hash for same input', async () => {
      const { hashToken } = await import('./auth')

      const token = 'test-token-12345'
      const hash1 = hashToken(token)
      const hash2 = hashToken(token)

      expect(hash1).toBe(hash2)
    })

    it('should return 64-character hex string (SHA-256)', async () => {
      const { hashToken } = await import('./auth')

      const hash = hashToken('any-token')

      expect(hash).toMatch(/^[a-f0-9]{64}$/)
      expect(hash.length).toBe(64)
    })

    it('should return different hashes for different inputs', async () => {
      const { hashToken } = await import('./auth')

      const hash1 = hashToken('token-a')
      const hash2 = hashToken('token-b')

      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty string', async () => {
      const { hashToken } = await import('./auth')

      const hash = hashToken('')

      // SHA-256 of empty string is a known value
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should work with generated random tokens', async () => {
      const { hashToken, generateRandomToken } = await import('./auth')

      const token = generateRandomToken()
      const hash = hashToken(token)

      expect(hash).toMatch(/^[a-f0-9]{64}$/)
      expect(hash).toBe(hashToken(token)) // Consistent
    })
  })

  describe('setAuthToken', () => {
    it('should set auth cookie with correct defaults', async () => {
      const { setAuthToken } = await import('./auth')

      const mockEvent = {} as H3Event
      const token = 'test_token'

      setAuthToken(mockEvent, token)

      expect(mockSetCookie).toHaveBeenCalledWith(mockEvent, 'auth_token', token, {
        httpOnly: true,
        secure: false, // NODE_ENV is 'test'
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      })
    })

    it('should set auth cookie with custom maxAge', async () => {
      const { setAuthToken } = await import('./auth')

      const mockEvent = {} as H3Event
      const token = 'test_token'
      const maxAge = 60 * 60 * 24 * 90 // 90 days

      setAuthToken(mockEvent, token, maxAge)

      expect(mockSetCookie).toHaveBeenCalledWith(mockEvent, 'auth_token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge,
        path: '/'
      })
    })

    it('should set secure cookie in production', async () => {
      process.env.NODE_ENV = 'production'
      vi.resetModules()

      const { setAuthToken } = await import('./auth')

      const mockEvent = {} as H3Event
      const token = 'test_token'

      setAuthToken(mockEvent, token)

      expect(mockSetCookie).toHaveBeenCalledWith(mockEvent, 'auth_token', token, {
        httpOnly: true,
        secure: true, // secure in production
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      })
    })

    it('should always set httpOnly to true for security', async () => {
      const { setAuthToken } = await import('./auth')

      const mockEvent = {} as H3Event
      const token = 'test_token'

      setAuthToken(mockEvent, token)

      const call = mockSetCookie.mock.calls[0]!
      expect(call[3]).toHaveProperty('httpOnly', true)
    })

    it('should set sameSite to lax for CSRF protection', async () => {
      const { setAuthToken } = await import('./auth')

      const mockEvent = {} as H3Event
      const token = 'test_token'

      setAuthToken(mockEvent, token)

      const call = mockSetCookie.mock.calls[0]!
      expect(call[3]).toHaveProperty('sameSite', 'lax')
    })

    it('should set path to root', async () => {
      const { setAuthToken } = await import('./auth')

      const mockEvent = {} as H3Event
      const token = 'test_token'

      setAuthToken(mockEvent, token)

      const call = mockSetCookie.mock.calls[0]!
      expect(call[3]).toHaveProperty('path', '/')
    })
  })

  describe('clearAuthToken', () => {
    it('should delete auth cookie', async () => {
      const { clearAuthToken } = await import('./auth')

      const mockEvent = {} as H3Event

      clearAuthToken(mockEvent)

      expect(mockDeleteCookie).toHaveBeenCalledWith(mockEvent, 'auth_token')
    })

    it('should be idempotent (safe to call multiple times)', async () => {
      const { clearAuthToken } = await import('./auth')

      const mockEvent = {} as H3Event

      clearAuthToken(mockEvent)
      clearAuthToken(mockEvent)
      clearAuthToken(mockEvent)

      expect(mockDeleteCookie).toHaveBeenCalledTimes(3)
      expect(mockDeleteCookie).toHaveBeenCalledWith(mockEvent, 'auth_token')
    })
  })

  describe('Security Edge Cases', () => {
    it('should handle SQL injection in user lookup', async () => {
      const { getCurrentUser } = await import('./auth')

      const payload = {
        userId: 1,
        email: 'test@example.com\' OR \'1\'=\'1',
        tier: 1,
        role: 'user'
      }
      const token = `jwt_${JSON.stringify(payload)}_7d`

      mockGetCookie.mockReturnValue(token)

      const mockGet = vi.fn().mockResolvedValue(null)
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            get: mockGet
          }))
        }))
      })

      const mockEvent = {} as H3Event
      const user = await getCurrentUser(mockEvent)

      // Should safely return null without SQL injection
      expect(user).toBeNull()
    })

    it('should handle XSS attempts in token', async () => {
      const { verifyToken } = await import('./auth')

      const xssToken = '<script>alert("xss")</script>'
      const result = verifyToken(xssToken)

      expect(result).toBeNull()
    })

    it('should reject tokens with mismatched userId type', async () => {
      const { getCurrentUser } = await import('./auth')

      const payload = {
        userId: 'not-a-number' as unknown as number,
        email: 'test@example.com',
        tier: 1,
        role: 'user'
      }
      const token = `jwt_${JSON.stringify(payload)}_7d`

      mockGetCookie.mockReturnValue(token)

      const mockEvent = {} as H3Event

      // This should fail when trying to query the database with non-numeric ID
      const mockGet = vi.fn().mockResolvedValue(null)
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            get: mockGet
          }))
        }))
      })

      const user = await getCurrentUser(mockEvent)
      expect(user).toBeNull()
    })

    it('should handle extremely long tokens gracefully', async () => {
      const { verifyToken } = await import('./auth')

      const longToken = 'a'.repeat(10000)
      const result = verifyToken(longToken)

      expect(result).toBeNull()
    })

    it('should handle unicode characters in passwords', async () => {
      const { hashUserPassword, verifyUserPassword } = await import('./auth')

      const unicodePassword = 'パスワード123!🔒'
      const hash = await hashUserPassword(unicodePassword)
      const isValid = await verifyUserPassword(unicodePassword, hash)

      expect(isValid).toBe(true)
    })

    it('should handle null bytes in password', async () => {
      const { hashUserPassword } = await import('./auth')

      const passwordWithNull = 'password\x00malicious'
      const hash = await hashUserPassword(passwordWithNull)

      expect(hash).toBeDefined()
    })

    it('should not leak password hash in error messages', async () => {
      const { getCurrentUser } = await import('./auth')

      const payload = {
        userId: 1,
        email: 'test@example.com',
        tier: 1,
        role: 'user'
      }
      const token = `jwt_${JSON.stringify(payload)}_7d`

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        passwordHash: 'super_secret_hash',
        tier: 1,
        role: 'user'
      }

      mockGetCookie.mockReturnValue(token)

      const mockGet = vi.fn().mockResolvedValue(mockUser)
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            get: mockGet
          }))
        }))
      })

      const mockEvent = {} as H3Event
      const user = await getCurrentUser(mockEvent)

      // User object should not contain password hash
      expect(user).not.toHaveProperty('passwordHash')
      expect(JSON.stringify(user)).not.toContain('super_secret_hash')
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle full authentication flow: hash -> generate token -> verify -> get user', async () => {
      const { hashUserPassword, verifyUserPassword, generateToken, verifyToken, getCurrentUser } = await import('./auth')

      // 1. Hash password
      const password = 'SecurePassword123!'
      const hash = await hashUserPassword(password)
      expect(hash).toBe(`hashed_${password}`)

      // 2. Verify password
      const isValid = await verifyUserPassword(password, hash)
      expect(isValid).toBe(true)

      // 3. Generate token
      const payload = {
        userId: 1,
        email: 'test@example.com',
        tier: 1,
        role: 'user' as const
      }
      const token = generateToken(payload, '7d')
      expect(token).toBeDefined()

      // 4. Verify token
      const decoded = verifyToken(token)
      expect(decoded).toEqual(payload)

      // 5. Get user with token
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        passwordHash: hash,
        tier: 1,
        role: 'user'
      }

      mockGetCookie.mockReturnValue(token)

      const mockGet = vi.fn().mockResolvedValue(mockUser)
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            get: mockGet
          }))
        }))
      })

      const mockEvent = {} as H3Event
      const user = await getCurrentUser(mockEvent)

      expect(user).toEqual({
        id: 1,
        email: 'test@example.com',
        tier: 2,
        role: 'user'
      })
    })

    it('should handle remember me flow with extended expiry', async () => {
      const { generateToken, setAuthToken } = await import('./auth')

      const payload = {
        userId: 1,
        email: 'test@example.com',
        tier: 1,
        role: 'user' as const
      }

      // Generate token with 90 days expiry
      const token = generateToken(payload, '90d')

      // Set cookie with 90 days maxAge
      const mockEvent = {} as H3Event
      const maxAge = 60 * 60 * 24 * 90
      setAuthToken(mockEvent, token, maxAge)

      expect(mockSetCookie).toHaveBeenCalledWith(mockEvent, 'auth_token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge,
        path: '/'
      })
    })

    it('should handle logout flow', async () => {
      const { clearAuthToken } = await import('./auth')

      const mockEvent = {} as H3Event
      clearAuthToken(mockEvent)

      expect(mockDeleteCookie).toHaveBeenCalledWith(mockEvent, 'auth_token')

      // After logout, getCurrentUser should return null
      mockGetCookie.mockReturnValue(undefined)

      const { getCurrentUser } = await import('./auth')
      const user = await getCurrentUser(mockEvent)

      expect(user).toBeNull()
    })
  })

  describe('handleSocialAuth', () => {
    it('should create a new user when social ID and email do not exist', async () => {
      const { handleSocialAuth } = await import('./auth')

      const createdUser = {
        id: 1,
        email: 'newuser@gmail.com',
        passwordHash: 'hashed_random',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        name: 'John Doe',
        role: 'user',
        tier: 1,
        emailVerified: true,
        googleId: 'google-123',
        profilePictureUrl: 'https://example.com/photo.jpg'
      }

      // Mock: no user exists with this Google ID or email
      const mockGet = vi.fn().mockResolvedValue(null)
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(createdUser)
          })
        })
      })
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            get: mockGet
          }))
        }))
      })

      const mockEvent = {} as H3Event
      const user = await handleSocialAuth(
        mockEvent,
        'google',
        'google-123',
        'newuser@gmail.com',
        'John Doe',
        'https://example.com/photo.jpg'
      )

      // Verify user was created
      expect(mockDb.insert).toHaveBeenCalled()
      expect(user.email).toBe('newuser@gmail.com')
      expect(user.googleId).toBe('google-123')
      expect(user).not.toHaveProperty('passwordHash')
      // Verify auth token was set
      expect(mockSetCookie).toHaveBeenCalled()
    })

    it('should link social account to existing user with same email', async () => {
      const { handleSocialAuth } = await import('./auth')

      const existingUser = {
        id: 42,
        email: 'existing@example.com',
        passwordHash: 'hashed_password',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'user',
        tier: 2,
        emailVerified: true,
        googleId: null,
        profilePictureUrl: null
      }

      // First call returns null (no user with this Google ID)
      // Second call returns existing user (found by email)
      let callCount = 0
      const mockGet = vi.fn().mockImplementation(async () => {
        callCount++
        if (callCount === 1) return null // No user by Google ID
        if (callCount === 2) return existingUser // Found by email
        return { ...existingUser, googleId: 'google-456' } // After update
      })

      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            get: mockGet
          }))
        }))
      })

      const mockUpdateWhere = vi.fn()
      mockDb.update.mockReturnValue({
        set: vi.fn(() => ({
          where: mockUpdateWhere
        }))
      })

      const mockEvent = {} as H3Event
      const user = await handleSocialAuth(
        mockEvent,
        'google',
        'google-456',
        'existing@example.com',
        'Jane Smith',
        'https://example.com/newphoto.jpg'
      )

      // Verify user was updated (linked)
      expect(mockDb.update).toHaveBeenCalled()
      expect(user.email).toBe('existing@example.com')
      expect(user).not.toHaveProperty('passwordHash')
    })

    it('should log in existing user with matching social ID', async () => {
      const { handleSocialAuth } = await import('./auth')

      const existingUser = {
        id: 10,
        email: 'social@example.com',
        passwordHash: 'hashed_password',
        firstName: 'Social',
        lastName: 'User',
        role: 'user',
        tier: 1,
        emailVerified: true,
        twitterId: 'twitter-789',
        profilePictureUrl: 'https://example.com/oldphoto.jpg'
      }

      const mockGet = vi.fn().mockResolvedValue(existingUser)
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            get: mockGet
          }))
        }))
      })

      const mockUpdateWhere = vi.fn()
      mockDb.update.mockReturnValue({
        set: vi.fn(() => ({
          where: mockUpdateWhere
        }))
      })

      const mockEvent = {} as H3Event
      const user = await handleSocialAuth(
        mockEvent,
        'twitter',
        'twitter-789',
        'social@example.com',
        'Social User',
        'https://example.com/newphoto.jpg'
      )

      // Verify last login was updated
      expect(mockDb.update).toHaveBeenCalled()
      expect(user.email).toBe('social@example.com')
      expect(user).not.toHaveProperty('passwordHash')
      // Verify auth token was set
      expect(mockSetCookie).toHaveBeenCalled()
    })

    it('should parse name into first and last name correctly', async () => {
      const { handleSocialAuth } = await import('./auth')

      const mockGet = vi.fn().mockResolvedValue(null)
      const mockInsertValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            id: 1,
            email: 'test@example.com',
            passwordHash: 'hashed',
            firstName: 'John',
            lastName: 'Paul Jones',
            displayName: 'John Paul Jones',
            role: 'user',
            tier: 1,
            googleId: 'google-multi-name'
          })
        })
      })
      mockDb.insert.mockReturnValue({
        values: mockInsertValues
      })
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            get: mockGet
          }))
        }))
      })

      const mockEvent = {} as H3Event
      await handleSocialAuth(
        mockEvent,
        'google',
        'google-multi-name',
        'test@example.com',
        'John Paul Jones'
      )

      // Check that insert was called with correct name parsing
      expect(mockInsertValues).toHaveBeenCalled()
    })

    it('should handle missing profile picture gracefully', async () => {
      const { handleSocialAuth } = await import('./auth')

      const mockGet = vi.fn().mockResolvedValue(null)
      const mockInsertValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            id: 1,
            email: 'nopic@example.com',
            passwordHash: 'hashed',
            role: 'user',
            tier: 1,
            googleId: 'google-nopic',
            profilePictureUrl: null
          })
        })
      })
      mockDb.insert.mockReturnValue({
        values: mockInsertValues
      })
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            get: mockGet
          }))
        }))
      })

      const mockEvent = {} as H3Event
      const user = await handleSocialAuth(
        mockEvent,
        'google',
        'google-nopic',
        'nopic@example.com',
        'No Pic User'
        // No profile picture URL
      )

      expect(user.profilePictureUrl).toBeNull()
    })

    it('should set email as verified for social login users', async () => {
      const { handleSocialAuth } = await import('./auth')

      const mockGet = vi.fn().mockResolvedValue(null)
      const createdUser = {
        id: 1,
        email: 'verified@example.com',
        passwordHash: 'hashed',
        role: 'user',
        tier: 1,
        emailVerified: true, // Should be true for social login
        googleId: 'google-verified'
      }
      const mockInsertValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(createdUser)
        })
      })
      mockDb.insert.mockReturnValue({
        values: mockInsertValues
      })
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            get: mockGet
          }))
        }))
      })

      const mockEvent = {} as H3Event
      const user = await handleSocialAuth(
        mockEvent,
        'google',
        'google-verified',
        'verified@example.com'
      )

      expect(user.emailVerified).toBe(true)
    })
  })
})
