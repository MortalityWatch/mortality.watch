import type { ZodSchema, ZodError } from 'zod'
import { ref } from 'vue'
import { logger } from '@/lib/logger'

/**
 * Validation result containing validity state and error messages
 */
export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean
  /** Map of field names to error messages */
  errors: Record<string, string>
}

/**
 * Form validation composable using Zod schemas
 *
 * Provides a unified interface for form validation with:
 * - Full form validation
 * - Single field validation
 * - Reactive error state
 * - Clear error messages
 *
 * @example
 * ```ts
 * import { z } from 'zod'
 *
 * const schema = z.object({
 *   email: z.string().email('Invalid email address'),
 *   password: z.string().min(8, 'Must be at least 8 characters')
 * })
 *
 * const { validate, validateField, errors, clearErrors } = useFormValidation(schema)
 *
 * // Validate entire form
 * const result = validate(formData)
 * if (!result.valid) {
 *   // errors.value will contain field-specific error messages
 *   console.log(errors.value)
 * }
 *
 * // Validate single field on blur
 * const emailError = validateField('email', emailValue)
 * if (emailError) {
 *   console.log(emailError)
 * }
 *
 * // Clear all errors
 * clearErrors()
 * ```
 *
 * @param schema - Zod schema to validate against
 * @returns Validation utilities and reactive error state
 */
export function useFormValidation<T extends ZodSchema>(schema: T) {
  /**
   * Reactive error state
   * Maps field names to their error messages
   */
  const errors = ref<Record<string, string>>({})

  /**
   * Validate entire form data against the schema
   *
   * @param data - Form data to validate
   * @returns Validation result with validity state and errors
   */
  function validate(data: unknown): ValidationResult {
    try {
      schema.parse(data)
      errors.value = {}
      return {
        valid: true,
        errors: {}
      }
    } catch (error) {
      const zodError = error as ZodError
      const fieldErrors: Record<string, string> = {}

      zodError.issues.forEach((err) => {
        const path = err.path.join('.')
        if (path) {
          // Use the first error message for each field
          if (!fieldErrors[path]) {
            fieldErrors[path] = err.message
          }
        }
      })

      errors.value = fieldErrors
      return {
        valid: false,
        errors: fieldErrors
      }
    }
  }

  /**
   * Validate a single field
   *
   * Useful for inline validation on blur or input events.
   * Updates the errors state for that field.
   *
   * @param fieldName - Name of the field to validate
   * @param value - Value to validate
   * @returns Error message if validation fails, null otherwise
   */
  function validateField(fieldName: string, value: unknown): string | null {
    // Get the field schema from the full schema
    // @ts-expect-error - Accessing internal Zod shape
    const fieldSchema = schema.shape?.[fieldName]

    if (!fieldSchema) {
      logger.warn(`Field "${fieldName}" not found in schema`)
      return null
    }

    try {
      fieldSchema.parse(value)
      // Clear error for this field
      const { [fieldName]: _removed, ...newErrors } = errors.value
      errors.value = newErrors
      return null
    } catch (error) {
      const zodError = error as ZodError
      const errorMessage = zodError.issues[0]?.message || 'Invalid value'

      // Set error for this field
      errors.value = {
        ...errors.value,
        [fieldName]: errorMessage
      }

      return errorMessage
    }
  }

  /**
   * Clear all validation errors
   *
   * Resets the errors state to an empty object.
   * Useful when resetting forms or dismissing error messages.
   */
  function clearErrors(): void {
    errors.value = {}
  }

  /**
   * Clear error for a specific field
   *
   * @param fieldName - Name of the field to clear error for
   */
  function clearFieldError(fieldName: string): void {
    const { [fieldName]: _removed, ...newErrors } = errors.value
    errors.value = newErrors
  }

  /**
   * Get error message for a specific field
   *
   * @param fieldName - Name of the field
   * @returns Error message if exists, undefined otherwise
   */
  function getError(fieldName: string): string | undefined {
    return errors.value[fieldName]
  }

  /**
   * Check if a specific field has an error
   *
   * @param fieldName - Name of the field
   * @returns True if field has an error, false otherwise
   */
  function hasError(fieldName: string): boolean {
    return !!errors.value[fieldName]
  }

  /**
   * Check if any fields have errors
   *
   * @returns True if any errors exist, false otherwise
   */
  function hasErrors(): boolean {
    return Object.keys(errors.value).length > 0
  }

  return {
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    getError,
    hasError,
    hasErrors,
    errors
  }
}
