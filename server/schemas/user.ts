import { z } from 'zod'
import { TierSchema, RoleSchema } from './common'

/**
 * User-related Zod schemas for API responses
 * Provides runtime validation for user data
 */

// User object schema (without sensitive fields)
export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  displayName: z.string().nullable(),
  name: z.string().nullable(), // Legacy field
  role: RoleSchema,
  tier: TierSchema,
  emailVerified: z.boolean(),
  tosAcceptedAt: z.date().nullable(),
  lastLogin: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// User without dates (for some responses)
export const UserSimpleSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  displayName: z.string().nullable(),
  name: z.string().nullable(),
  role: RoleSchema,
  tier: TierSchema,
  emailVerified: z.boolean()
})

// Session response schema
export const SessionResponseSchema = z.object({
  user: UserSchema.nullable(),
  authenticated: z.boolean()
})

// Auth success response schema
export const AuthSuccessResponseSchema = z.object({
  success: z.literal(true),
  user: UserSchema,
  message: z.string()
})

// Registration response schema
export const RegisterResponseSchema = z.object({
  success: z.literal(true),
  user: UserSchema,
  message: z.string(),
  requiresVerification: z.boolean()
})

// Profile update response schema
export const ProfileUpdateResponseSchema = z.object({
  success: z.literal(true),
  user: UserSchema,
  message: z.string()
})

// Export types
export type User = z.infer<typeof UserSchema>
export type UserSimple = z.infer<typeof UserSimpleSchema>
export type SessionResponse = z.infer<typeof SessionResponseSchema>
export type AuthSuccessResponse = z.infer<typeof AuthSuccessResponseSchema>
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>
export type ProfileUpdateResponse = z.infer<typeof ProfileUpdateResponseSchema>
