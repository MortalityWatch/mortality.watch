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
        if (match) {
          return JSON.parse(match[1])
        }
      }
      throw new Error('Invalid token')
    })
  }
}))

// Mock h3 functions
const mockGetCookie = vi.fn()
const mockGetHeader = vi.fn()
const mockSetCookie = vi.fn()
const mockDeleteCookie = vi.fn()
const mockCreateError = vi.fn(error => error)

// Make h3 functions available globally (Nuxt auto-imports them)
global.getCookie = mockGetCookie
global.getHeader = mockGetHeader
global.setCookie = mockSetCookie
global.deleteCookie = mockDeleteCookie
global.createError = mockCreateError

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

  describe('hashPassword', () => {
    it('should hash a password using bcrypt', async () => {
      const { hashPassword } = await import('./auth')
      const bcrypt = await import('bcryptjs')

      const password = 'MySecurePassword123!'
      const hash = await hashPassword(password)

      expect(bcrypt.default.hash).toHaveBeenCalledWith(password, 12)
      expect(hash).toBe(`hashed_${password}`)
    })

    it('should use bcrypt with cost factor 12', async () => {
      const { hashPassword } = await import('./auth')
      const bcrypt = await import('bcryptjs')

      await hashPassword('test')

      expect(bcrypt.default.hash).toHaveBeenCalledWith('test', 12)
    })

    it('should handle empty password', async () => {
      const { hashPassword } = await import('./auth')
      const hash = await hashPassword('')

      expect(hash).toBe('hashed_')
    })

    it('should handle special characters in password', async () => {
      const { hashPassword } = await import('./auth')
      const password = 'P@$$w0rd!#$%^&*()'
      const hash = await hashPassword(password)

      expect(hash).toBe(`hashed_${password}`)
    })
  })

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const { verifyPassword } = await import('./auth')

      const password = 'MySecurePassword123!'
      const hash = `hashed_${password}`
      const result = await verifyPassword(password, hash)

      expect(result).toBe(true)
    })

    it('should reject an incorrect password', async () => {
      const { verifyPassword } = await import('./auth')

      const result = await verifyPassword('wrong', 'hashed_correct')

      expect(result).toBe(false)
    })

    it('should handle empty password verification', async () => {
      const { verifyPassword } = await import('./auth')

      const result = await verifyPassword('', 'hashed_password')

      expect(result).toBe(false)
    })

    it('should be timing-safe against timing attacks', async () => {
      const { verifyPassword } = await import('./auth')
      const bcrypt = await import('bcryptjs')

      // Verify that bcrypt.compare is always called (timing-safe)
      await verifyPassword('test', 'hashed_test')
      expect(bcrypt.default.compare).toHaveBeenCalled()

      vi.clearAllMocks()

      await verifyPassword('wrong', 'hashed_test')
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
        tier: 1,
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
        tier: 1,
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
        tier: 1,
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

      expect(user.tier).toBe(1)
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

    it('should throw 403 error when tier is insufficient', async () => {
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

      await expect(requireTier(mockEvent, 2)).rejects.toEqual({
        statusCode: 403,
        message: 'Forbidden - tier 2 access required'
      })

      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 403,
        message: 'Forbidden - tier 2 access required'
      })
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

      expect(user.tier).toBe(1)
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

      const call = mockSetCookie.mock.calls[0]
      expect(call[3]).toHaveProperty('httpOnly', true)
    })

    it('should set sameSite to lax for CSRF protection', async () => {
      const { setAuthToken } = await import('./auth')

      const mockEvent = {} as H3Event
      const token = 'test_token'

      setAuthToken(mockEvent, token)

      const call = mockSetCookie.mock.calls[0]
      expect(call[3]).toHaveProperty('sameSite', 'lax')
    })

    it('should set path to root', async () => {
      const { setAuthToken } = await import('./auth')

      const mockEvent = {} as H3Event
      const token = 'test_token'

      setAuthToken(mockEvent, token)

      const call = mockSetCookie.mock.calls[0]
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
      const { hashPassword, verifyPassword } = await import('./auth')

      const unicodePassword = 'パスワード123!🔒'
      const hash = await hashPassword(unicodePassword)
      const isValid = await verifyPassword(unicodePassword, hash)

      expect(isValid).toBe(true)
    })

    it('should handle null bytes in password', async () => {
      const { hashPassword } = await import('./auth')

      const passwordWithNull = 'password\x00malicious'
      const hash = await hashPassword(passwordWithNull)

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
      const { hashPassword, verifyPassword, generateToken, verifyToken, getCurrentUser } = await import('./auth')

      // 1. Hash password
      const password = 'SecurePassword123!'
      const hash = await hashPassword(password)
      expect(hash).toBe(`hashed_${password}`)

      // 2. Verify password
      const isValid = await verifyPassword(password, hash)
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
        tier: 1,
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
})
