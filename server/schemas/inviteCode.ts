import { z } from 'zod'

/**
 * Invite code-related Zod schemas for API validation
 * Provides runtime validation for invite code data
 */

// Invite code schema (full object)
// Note: All invite codes grant Pro access (tier 2)
export const InviteCodeSchema = z.object({
  id: z.number(),
  code: z.string(),
  createdBy: z.number().nullable(),
  maxUses: z.number(),
  currentUses: z.number(),
  expiresAt: z.date().nullable(),
  grantsProUntil: z.date().nullable(),
  notes: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// Create invite code input schema
export const CreateInviteCodeSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(50, 'Code must be at most 50 characters')
    .regex(
      /^[A-Z0-9-]+$/,
      'Code must contain only uppercase letters, numbers, and hyphens'
    ),
  maxUses: z.number().int().positive().default(1),
  expiresAt: z.string().datetime().optional(), // ISO date string
  grantsProMonths: z.number().int().positive().optional(), // Convenience field - converts to grantsProUntil
  notes: z.string().optional()
})

// Update invite code input schema
export const UpdateInviteCodeSchema = z.object({
  isActive: z.boolean().optional(),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  notes: z.string().optional()
})

// Validate invite code request schema
export const ValidateInviteCodeSchema = z.object({
  code: z.string().min(1, 'Code is required')
})

// Apply invite code request schema (for retroactive application)
export const ApplyInviteCodeSchema = z.object({
  code: z.string().min(1, 'Code is required')
})

// Batch generate codes schema
export const BatchGenerateCodesSchema = z.object({
  count: z.number().int().min(1).max(100),
  prefix: z.string().max(20).optional(),
  maxUses: z.number().int().positive().default(1),
  grantsProMonths: z.number().int().positive().optional(),
  notes: z.string().optional()
})

// Validation response schema
export const ValidateInviteCodeResponseSchema = z.object({
  valid: z.boolean(),
  message: z.string().optional(),
  grantsProUntil: z.date().nullable().optional()
})

// Export types
export type InviteCode = z.infer<typeof InviteCodeSchema>
export type CreateInviteCodeInput = z.infer<typeof CreateInviteCodeSchema>
export type UpdateInviteCodeInput = z.infer<typeof UpdateInviteCodeSchema>
export type ValidateInviteCodeInput = z.infer<typeof ValidateInviteCodeSchema>
export type ApplyInviteCodeInput = z.infer<typeof ApplyInviteCodeSchema>
export type BatchGenerateCodesInput = z.infer<typeof BatchGenerateCodesSchema>
export type ValidateInviteCodeResponse = z.infer<
  typeof ValidateInviteCodeResponseSchema
>
