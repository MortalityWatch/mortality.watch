// requireAdmin and db are auto-imported
import { dataQualityOverrides } from '#db'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

/**
 * Admin API: Set data quality override status
 * POST /api/admin/data-quality-override
 *
 * Allows admins to mute/hide/monitor specific country-source combinations
 */

const bodySchema = z.object({
  iso3c: z.string().length(3),
  source: z.string().min(1),
  status: z.enum(['monitor', 'muted', 'hidden']),
  notes: z.string().optional()
})

export default defineEventHandler(async (event) => {
  // Require admin authentication
  const user = await requireAdmin(event)

  const body = await readBody(event)
  const validated = bodySchema.parse(body)

  try {
    // Check if override already exists
    const existing = await db
      .select()
      .from(dataQualityOverrides)
      .where(
        and(
          eq(dataQualityOverrides.iso3c, validated.iso3c),
          eq(dataQualityOverrides.source, validated.source)
        )
      )
      .get()

    if (existing) {
      // Update existing override
      const updated = await db
        .update(dataQualityOverrides)
        .set({
          status: validated.status,
          notes: validated.notes,
          updatedBy: user.id,
          updatedAt: new Date()
        })
        .where(eq(dataQualityOverrides.id, existing.id))
        .returning()
        .get()

      return {
        success: true,
        override: updated
      }
    } else {
      // Create new override
      const created = await db
        .insert(dataQualityOverrides)
        .values({
          iso3c: validated.iso3c,
          source: validated.source,
          status: validated.status,
          notes: validated.notes,
          updatedBy: user.id
        })
        .returning()
        .get()

      return {
        success: true,
        override: created
      }
    }
  } catch (error) {
    console.error('Error setting data quality override:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to set override'
    })
  }
})
