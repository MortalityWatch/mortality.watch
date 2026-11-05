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

  describe('hashUserPassword', () => {
    it('should hash a password using bcrypt', async () => {
      const { hashUserPassword } = await import('./auth')
      const bcrypt = await import('bcryptjs')

      const password = 'MySecurePassword123!'
      const hash = await hashUserPassword(password)

      expect(bcrypt.default.hash).toHaveBeenCalledWith(password, 12)
      expect(hash).toBe(`hashed_${password}`)
    })

    it('should use bcrypt with cost factor 12', async () => {
      const { hashUserPassword } = await import('./auth')
      const bcrypt = await import('bcryptjs')

      await hashUserPassword('test')

      expect(bcrypt.default.hash).toHaveBeenCalledWith('test', 12)
    })

    it('should handle empty password', async () => {
      const { hashUserPassword } = await import('./auth')
      const hash = await hashUserPassword('')

      expect(hash).toBe('hashed_')
    })

    it('should handle special characters in password', async () => {
      const { hashUserPassword } = await import('./auth')
      const password = 'P@$$w0rd!#$%^&*()'
      const hash = await hashUserPassword(password)

      expect(hash).toBe(`hashed_${password}`)
    })
  })

  describe('verifyUserPassword', () => {
    it('should verify a correct password', async () => {
      const { verifyUserPassword } = await import('./auth')

      const password = 'MySecurePassword123!'
      const hash = `hashed_${password}`
      const result = await verifyUserPassword(password, hash)

      expect(result).toBe(true)
    })

    it('should reject an incorrect password', async () => {
      const { verifyUserPassword } = await import('./auth')

      const result = await verifyUserPassword('wrong', 'hashed_correct')

      expect(result).toBe(false)
    })

    it('should handle empty password verification', async () => {
      const { verifyUserPassword } = await import('./auth')

      const result = await verifyUserPassword('', 'hashed_password')

      expect(result).toBe(false)
    })

    it('should be timing-safe against timing attacks', async () => {
      const { verifyUserPassword } = await import('./auth')
      const bcrypt = await import('bcryptjs')

      // Verify that bcrypt.compare is always called (timing-safe)
      await verifyUserPassword('test', 'hashed_test')
      expect(bcrypt.default.compare).toHaveBeenCalled()

      vi.clearAllMocks()

      await verifyUserPassword('wrong', 'hashed_test')
      expect(bcrypt.default.compare).toHaveBeenCalled()
    })
  })

  describe('generateToken', () => {
    it('should generate a JWT token with user payload', async () => {
      const { generateToken } = await import('./auth')
      const jwt = await import('jsonwebtoken')

      const payload = {
        userId: 1,
        email: 'test@example.com',
        tier: 1,
        role: 'user'
      }

      const token = generateToken(payload)

      expect(jwt.default.sign).toHaveBeenCalledWith(
        payload,
        'test-secret-key',
        { expiresIn: '7d' }
      )
      expect(token).toBe(`jwt_${JSON.stringify(payload)}_7d`)
    })

    it('should support custom expiry time', async () => {
      const { generateToken } = await import('./auth')
      const jwt = await import('jsonwebtoken')

      const payload = {
        userId: 1,
        email: 'test@example.com',
        tier: 2,
        role: 'user'
      }

      const token = generateToken(payload, '90d')

      expect(jwt.default.sign).toHaveBeenCalledWith(
        payload,
        'test-secret-key',
        { expiresIn: '90d' }
      )
      expect(token).toBe(`jwt_${JSON.stringify(payload)}_90d`)
    })

    it('should support numeric expiry time', async () => {
      const { generateToken } = await import('./auth')
      const jwt = await import('jsonwebtoken')

      const payload = {
        userId: 1,
        email: 'test@example.com',
        tier: 1,
        role: 'user'
      }

      generateToken(payload, 3600)

      expect(jwt.default.sign).toHaveBeenCalledWith(
        payload,
        'test-secret-key',
        { expiresIn: 3600 }
      )
    })

    it('should default to 7 days expiry', async () => {
      const { generateToken } = await import('./auth')
      const jwt = await import('jsonwebtoken')

      const payload = {
        userId: 1,
        email: 'test@example.com',
        tier: 1,
        role: 'user'
      }

      generateToken(payload)

      expect(jwt.default.sign).toHaveBeenCalledWith(
        payload,
        'test-secret-key',
        { expiresIn: '7d' }
      )
    })

    it('should throw error when JWT_SECRET is missing in production', async () => {
      delete process.env.JWT_SECRET
      process.env.NODE_ENV = 'production'

      // Need to reimport to trigger the check
      vi.resetModules()

      const { generateToken } = await import('./auth')

      const payload = {
        userId: 1,
        email: 'test@example.com',
        tier: 1,
        role: 'user'
      }

      expect(() => generateToken(payload)).toThrow('JWT_SECRET environment variable is required in production')
    })

    it('should use default secret in development when JWT_SECRET is missing', async () => {
      delete process.env.JWT_SECRET
      process.env.NODE_ENV = 'development'

      vi.resetModules()

      const { generateToken } = await import('./auth')
      const jwt = await import('jsonwebtoken')

      const payload = {
        userId: 1,
        email: 'test@example.com',
        tier: 1,
        role: 'user'
      }

      generateToken(payload)

      expect(jwt.default.sign).toHaveBeenCalledWith(
        payload,
        'development-secret-key-change-in-production',
        { expiresIn: '7d' }
      )
    })
  })

  describe('verifyToken', () => {
    it('should verify and decode a valid JWT token', async () => {
      const { verifyToken } = await import('./auth')

      const payload = {
        userId: 1,
        email: 'test@example.com',
        tier: 1,
        role: 'user'
      }

      const token = `jwt_${JSON.stringify(payload)}_7d`
      const decoded = verifyToken(token)

      expect(decoded).toEqual(payload)
    })

    it('should return null for invalid token', async () => {
      const { verifyToken } = await import('./auth')

      const decoded = verifyToken('invalid_token')

      expect(decoded).toBeNull()
    })

    it('should return null for expired token', async () => {
      const { verifyToken } = await import('./auth')
      const jwt = await import('jsonwebtoken')

      // Mock JWT verify to throw expired error
      vi.mocked(jwt.default.verify).mockImplementationOnce(() => {
        throw new Error('TokenExpiredError')
      })

      const decoded = verifyToken('expired_token')

      expect(decoded).toBeNull()
    })

    it('should return null for malformed token', async () => {
      const { verifyToken } = await import('./auth')

      const decoded = verifyToken('')

      expect(decoded).toBeNull()
    })

    it('should return null for tampered token', async () => {
      const { verifyToken } = await import('./auth')

      const decoded = verifyToken('jwt_tampered_data')

      expect(decoded).toBeNull()
    })
  })

  describe('getCurrentUser', () => {
    it('should get user from cookie token', async () => {
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
        passwordHash: 'hashed_password',
        tier: 1,
        role: 'user',
        firstName: 'Test',
        lastName: 'User'
      }

      mockGetCookie.mockReturnValue(token)
      mockGetHeader.mockReturnValue(undefined)

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

      expect(mockGetCookie).toHaveBeenCalledWith(mockEvent, 'auth_token')
      expect(user).toEqual({
        id: 1,
        email: 'test@example.com',
        tier: 2,
        role: 'user',
        firstName: 'Test',
        lastName: 'User'
      })
      expect(user).not.toHaveProperty('passwordHash')
    })

    it('should get user from Authorization header', async () => {
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
        passwordHash: 'hashed_password',
        tier: 1,
        role: 'user'
      }

      mockGetCookie.mockReturnValue(undefined)
      mockGetHeader.mockReturnValue(`Bearer ${token}`)

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

      expect(mockGetHeader).toHaveBeenCalledWith(mockEvent, 'authorization')
      expect(user).toEqual({
        id: 1,
        email: 'test@example.com',
        tier: 2,
        role: 'user'
      })
    })

    it('should return null when no token is provided', async () => {
      const { getCurrentUser } = await import('./auth')

      mockGetCookie.mockReturnValue(undefined)
      mockGetHeader.mockReturnValue(undefined)

      const mockEvent = {} as H3Event
      const user = await getCurrentUser(mockEvent)

      expect(user).toBeNull()
    })

    it('should return null when token is invalid', async () => {
      const { getCurrentUser } = await import('./auth')

      mockGetCookie.mockReturnValue('invalid_token')

      const mockEvent = {} as H3Event
      const user = await getCurrentUser(mockEvent)

      expect(user).toBeNull()
    })

    it('should return null when user is not found in database', async () => {
      const { getCurrentUser } = await import('./auth')

      const payload = {
        userId: 999,
        email: 'nonexistent@example.com',
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

      expect(user).toBeNull()
    })

    it('should prefer cookie over Authorization header', async () => {
      const { getCurrentUser } = await import('./auth')

      const payload = {
        userId: 1,
        email: 'test@example.com',
        tier: 1,
        role: 'user'
      }
      const cookieToken = `jwt_${JSON.stringify(payload)}_7d`
      const headerToken = `jwt_${JSON.stringify({ ...payload, userId: 2 })}_7d`

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        tier: 1,
        role: 'user'
      }

      mockGetCookie.mockReturnValue(cookieToken)
      mockGetHeader.mockReturnValue(`Bearer ${headerToken}`)

      const mockGet = vi.fn().mockResolvedValue(mockUser)
      mockDb.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            get: mockGet
          }))
        }))
      })

      const mockEvent = {} as H3Event
      await getCurrentUser(mockEvent)

      // Should use cookie token
      expect(mockGet).toHaveBeenCalled()
    })

    it('should handle Authorization header without Bearer prefix', async () => {
      const { getCurrentUser } = await import('./auth')

      mockGetCookie.mockReturnValue(undefined)
      mockGetHeader.mockReturnValue('invalid_format_token')

      const mockEvent = {} as H3Event
      const user = await getCurrentUser(mockEvent)

      expect(user).toBeNull()
    })
  })

  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      const { requireAuth } = await import('./auth')

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
        passwordHash: 'hashed_password',
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
      const user = await requireAuth(mockEvent)

      expect(user).toEqual({
        id: 1,
        email: 'test@example.com',
        tier: 2,
        role: 'user'
      })
    })

    it('should throw 401 error when not authenticated', async () => {
      const { requireAuth } = await import('./auth')

      mockGetCookie.mockReturnValue(undefined)
      mockGetHeader.mockReturnValue(undefined)

      const mockEvent = {} as H3Event

      await expect(requireAuth(mockEvent)).rejects.toEqual({
        statusCode: 401,
        message: 'Unauthorized - please sign in'
      })

      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 401,
        message: 'Unauthorized - please sign in'
      })
    })

    it('should throw 401 error when token is invalid', async () => {
      const { requireAuth } = await import('./auth')

      mockGetCookie.mockReturnValue('invalid_token')

      const mockEvent = {} as H3Event

      await expect(requireAuth(mockEvent)).rejects.toEqual({
        statusCode: 401,
        message: 'Unauthorized - please sign in'
      })
    })

    it('should throw 401 error when user no longer exists', async () => {
      const { requireAuth } = await import('./auth')

      const payload = {
        userId: 999,
        email: 'deleted@example.com',
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

      await expect(requireAuth(mockEvent)).rejects.toEqual({
        statusCode: 401,
        message: 'Unauthorized - please sign in'
      })
    })
  })

  describe('requireAdmin', () => {
    it('should return user when user is admin', async () => {
      const { requireAdmin } = await import('./auth')

      const payload = {
        userId: 1,
        email: 'admin@example.com',
        tier: 2,
        role: 'admin'
      }
      const token = `jwt_${JSON.stringify(payload)}_7d`

      const mockUser = {
        id: 1,
        email: 'admin@example.com',
        passwordHash: 'hashed_password',
        tier: 2,
        role: 'admin'
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
      const user = await requireAdmin(mockEvent)

      expect(user.role).toBe('admin')
      expect(user).toEqual({
        id: 1,
        email: 'admin@example.com',
        tier: 2,
        role: 'admin'
      })
    })

    it('should throw 403 error when user is not admin', async () => {
      const { requireAdmin } = await import('./auth')

      const payload = {
        userId: 1,
        email: 'user@example.com',
        tier: 1,
        role: 'user'
      }
      const token = `jwt_${JSON.stringify(payload)}_7d`

      const mockUser = {
        id: 1,
        email: 'user@example.com',
        passwordHash: 'hashed_password',
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

      await expect(requireAdmin(mockEvent)).rejects.toEqual({
        statusCode: 403,
        message: 'Forbidden - admin access required'
      })

      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 403,
        message: 'Forbidden - admin access required'
      })
    })

    it('should throw 401 error when not authenticated', async () => {
      const { requireAdmin } = await import('./auth')

      mockGetCookie.mockReturnValue(undefined)
      mockGetHeader.mockReturnValue(undefined)

      const mockEvent = {} as H3Event

      await expect(requireAdmin(mockEvent)).rejects.toEqual({
        statusCode: 401,
        message: 'Unauthorized - please sign in'
      })
    })
  })

  describe('requireTier', () => {
    it('should return user when tier is sufficient (tier 1 required, user has tier 1)', async () => {
      const { requireTier } = await import('./auth')

      const payload = {
        userId: 1,
        email: 'user@example.com',
        tier: 1,
        role: 'user'
      }
      const token = `jwt_${JSON.stringify(payload)}_7d`

      const mockUser = {
        id: 1,
        email: 'user@example.com',
        passwordHash: 'hashed_password',
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
      const user = await requireTier(mockEvent, 1)

      expect(user.tier).toBe(2)
    })

    it('should return user when tier is higher than required (tier 1 required, user has tier 2)', async () => {
      const { requireTier } = await import('./auth')

      const payload = {
        userId: 1,
        email: 'pro@example.com',
        tier: 2,
        role: 'user'
      }
      const token = `jwt_${JSON.stringify(payload)}_7d`

      const mockUser = {
        id: 1,
        email: 'pro@example.com',
        passwordHash: 'hashed_password',
        tier: 2,
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
      const user = await requireTier(mockEvent, 1)

      expect(user.tier).toBe(2)
    })

    it('should return user when tier 2 is required because authenticated users are automatic Pro', async () => {
      const { requireTier } = await import('./auth')

      const payload = {
        userId: 1,
        email: 'user@example.com',
        tier: 1,
        role: 'user'
      }
      const token = `jwt_${JSON.stringify(payload)}_7d`

      const mockUser = {
        id: 1,
        email: 'user@example.com',
        passwordHash: 'hashed_password',
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

      const user = await requireTier(mockEvent, 2)
      expect(user.tier).toBe(2)
    })

    it('should work with tier 0', async () => {
      const { requireTier } = await import('./auth')

      const payload = {
        userId: 1,
        email: 'user@example.com',
        tier: 1,
        role: 'user'
      }
      const token = `jwt_${JSON.stringify(payload)}_7d`

      const mockUser = {
        id: 1,
        email: 'user@example.com',
        passwordHash: 'hashed_password',
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
      const user = await requireTier(mockEvent, 0)

      expect(user.tier).toBe(2)
    })

    it('should throw 401 error when not authenticated', async () => {
      const { requireTier } = await import('./auth')

      mockGetCookie.mockReturnValue(undefined)
      mockGetHeader.mockReturnValue(undefined)

      const mockEvent = {} as H3Event

      await expect(requireTier(mockEvent, 1)).rejects.toEqual({
        statusCode: 401,
        message: 'Unauthorized - please sign in'
      })
    })
  })
})
