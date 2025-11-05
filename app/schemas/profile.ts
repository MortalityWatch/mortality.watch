import { z } from 'zod'

/**
 * Profile Validation Schemas
 *
 * Zod schemas for profile-related forms including:
 * - Personal information updates
 * - Password changes
 */

/**
 * Personal Information Schema
 *
 * Validates user profile fields like name and display name.
 * All fields are optional to allow partial updates.
 */
export const personalInfoSchema = z.object({
  displayName: z.string()
    .max(100, 'Display name must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  firstName: z.string()
    .max(50, 'First name must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  lastName: z.string()
    .max(50, 'Last name must be less than 50 characters')
    .optional()
    .or(z.literal(''))
})

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>

/**
 * Password Change Schema
 *
 * Validates password change form with:
 * - Current password verification
 * - New password requirements (min 8 characters)
 * - Password confirmation matching
 */
export const passwordChangeSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required')
    .min(8, 'Password must be at least 8 characters'),
  newPassword: z.string()
    .min(1, 'New password is required')
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
    .min(1, 'Password confirmation is required')
    .min(8, 'Password must be at least 8 characters')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
})

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>
