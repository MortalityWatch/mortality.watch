import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

/**
 * Invite codes table - stores invite codes for beta access and marketing
 * Defined first to avoid circular reference issues
 */
export const inviteCodes = sqliteTable(
  'invite_codes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    code: text('code').notNull().unique(),
    // Circular reference: inviteCodes -> users (users also references inviteCodes)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdBy: integer('created_by').references((): any => users.id),
    maxUses: integer('max_uses').notNull().default(1),
    currentUses: integer('current_uses').notNull().default(0),
    expiresAt: integer('expires_at', { mode: 'timestamp' }),
    grantsProUntil: integer('grants_pro_until', { mode: 'timestamp' }), // All codes grant Pro (tier 2)
    notes: text('notes'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
  },
  table => ({
    codeIdx: index('idx_invite_codes_code').on(table.code),
    activeIdx: index('idx_invite_codes_active').on(table.isActive),
    expiresIdx: index('idx_invite_codes_expires').on(table.expiresAt)
  })
)

/**
 * Users table - stores user accounts
 * Tier 0: Public (not stored in DB)
 * Tier 1: Free - Default for new users
 * Tier 2: Pro (PAID)
 */
export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    displayName: text('display_name'), // User-customizable display name
    name: text('name'), // Legacy field, kept for backward compatibility
    role: text('role', { enum: ['user', 'admin'] })
      .notNull()
      .default('user'),
    tier: integer('tier', { mode: 'number' })
      .notNull()
      .default(1)
      .$type<0 | 1 | 2>(),
    emailVerified: integer('email_verified', { mode: 'boolean' })
      .notNull()
      .default(false),
    verificationToken: text('verification_token'),
    verificationTokenExpires: integer('verification_token_expires', {
      mode: 'timestamp'
    }),
    passwordResetToken: text('password_reset_token'),
    passwordResetTokenExpires: integer('password_reset_token_expires', {
      mode: 'timestamp'
    }),
    // Pending email change (for users changing their email)
    pendingEmail: text('pending_email'),
    pendingEmailToken: text('pending_email_token'),
    pendingEmailTokenExpires: integer('pending_email_token_expires', {
      mode: 'timestamp'
    }),
    // Social login provider IDs
    googleId: text('google_id').unique(),
    twitterId: text('twitter_id').unique(),
    // Profile picture from social provider
    profilePictureUrl: text('profile_picture_url'),
    tosAcceptedAt: integer('tos_accepted_at', { mode: 'timestamp' }),
    lastLogin: integer('last_login', { mode: 'timestamp' }),
    invitedByCodeId: integer('invited_by_code_id').references(() => inviteCodes.id),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
  },
  table => ({
    emailIdx: index('idx_users_email').on(table.email),
    tierIdx: index('idx_users_tier').on(table.tier),
    roleIdx: index('idx_users_role').on(table.role),
    verificationTokenIdx: index('idx_verification_token').on(
      table.verificationToken
    ),
    passwordResetTokenIdx: index('idx_password_reset_token').on(
      table.passwordResetToken
    ),
    googleIdIdx: index('idx_users_google_id').on(table.googleId),
    twitterIdIdx: index('idx_users_twitter_id').on(table.twitterId),
    pendingEmailTokenIdx: index('idx_pending_email_token').on(
      table.pendingEmailToken
    )
  })
)

/**
 * Saved charts table - user's bookmarked charts with metadata
 * References charts table for the actual configuration
 */
export const savedCharts = sqliteTable(
  'saved_charts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    chartId: text('chart_id')
      .notNull()
      .references(() => charts.id),
    name: text('name').notNull(),
    description: text('description'),
    thumbnailUrl: text('thumbnail_url'),
    isFeatured: integer('is_featured', { mode: 'boolean' })
      .notNull()
      .default(false),
    isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
    slug: text('slug').unique(),
    viewCount: integer('view_count').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
  },
  table => ({
    userIdx: index('idx_saved_charts_user').on(table.userId),
    chartIdx: index('idx_saved_charts_chart').on(table.chartId),
    featuredIdx: index('idx_saved_charts_featured').on(table.isFeatured),
    publicIdx: index('idx_saved_charts_public').on(table.isPublic),
    slugIdx: index('idx_saved_charts_slug').on(table.slug),
    createdIdx: index('idx_saved_charts_created').on(table.createdAt)
  })
)

/**
 * Subscriptions table - stores Stripe subscription data
 */
export const subscriptions = sqliteTable(
  'subscriptions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    stripeCustomerId: text('stripe_customer_id').unique(),
    stripeSubscriptionId: text('stripe_subscription_id').unique(),
    status: text('status', {
      enum: [
        'active',
        'canceled',
        'past_due',
        'unpaid',
        'incomplete',
        'trialing',
        'inactive'
      ]
    })
      .notNull()
      .default('inactive'),
    plan: text('plan', { enum: ['monthly', 'yearly'] }),
    planPriceId: text('plan_price_id'),
    currentPeriodStart: integer('current_period_start', { mode: 'timestamp' }),
    currentPeriodEnd: integer('current_period_end', { mode: 'timestamp' }),
    cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' })
      .notNull()
      .default(false),
    canceledAt: integer('canceled_at', { mode: 'timestamp' }),
    trialEnd: integer('trial_end', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
  },
  table => ({
    userIdx: index('idx_subscriptions_user').on(table.userId),
    stripeCustomerIdx: index('idx_subscriptions_stripe_customer').on(
      table.stripeCustomerId
    ),
    stripeSubscriptionIdx: index('idx_subscriptions_stripe_subscription').on(
      table.stripeSubscriptionId
    ),
    statusIdx: index('idx_subscriptions_status').on(table.status),
    periodEndIdx: index('idx_subscriptions_period_end').on(
      table.currentPeriodEnd
    )
  })
)

/**
 * Webhook events table - logs Stripe webhook events for debugging
 */
export const webhookEvents = sqliteTable(
  'webhook_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    stripeEventId: text('stripe_event_id').notNull().unique(),
    eventType: text('event_type').notNull(),
    payload: text('payload').notNull(), // Full JSON payload
    processed: integer('processed', { mode: 'boolean' })
      .notNull()
      .default(false),
    processingError: text('processing_error'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    processedAt: integer('processed_at', { mode: 'timestamp' })
  },
  table => ({
    stripeEventIdIdx: index('idx_webhook_events_stripe_id').on(
      table.stripeEventId
    ),
    eventTypeIdx: index('idx_webhook_events_type').on(table.eventType),
    processedIdx: index('idx_webhook_events_processed').on(table.processed),
    createdIdx: index('idx_webhook_events_created').on(table.createdAt)
  })
)

/**
 * Sessions table - stores user sessions
 */
export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
  },
  table => ({
    userIdx: index('idx_sessions_user').on(table.userId),
    expiresIdx: index('idx_sessions_expires').on(table.expiresAt)
  })
)

/**
 * Data quality overrides table - stores admin preferences for monitoring
 */
export const dataQualityOverrides = sqliteTable(
  'data_quality_overrides',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    iso3c: text('iso3c').notNull(),
    source: text('source').notNull(),
    status: text('status', { enum: ['monitor', 'muted', 'hidden'] })
      .notNull()
      .default('monitor'),
    notes: text('notes'),
    updatedBy: integer('updated_by').references(() => users.id),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
  },
  table => ({
    uniqueEntry: index('idx_data_quality_unique').on(table.iso3c, table.source),
    statusIdx: index('idx_data_quality_status').on(table.status)
  })
)

/**
 * Charts table - canonical storage for chart configurations
 * Used for short URLs, QR codes, and as base for saved_charts
 * Hash is computed from normalized config (deterministic - same config = same hash)
 */
export const charts = sqliteTable(
  'charts',
  {
    id: text('id').primaryKey(), // 12-char hash of normalized config
    config: text('config').notNull(), // Query string (e.g., c=SWE&c=DEU&ct=yearly)
    page: text('page', { enum: ['explorer', 'ranking'] }).notNull().default('explorer'),
    createCount: integer('create_count').notNull().default(1), // Times this config was generated/shared
    accessCount: integer('access_count').notNull().default(0), // Times the short URL was visited
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp' })
  },
  table => ({
    pageIdx: index('idx_charts_page').on(table.page),
    createdIdx: index('idx_charts_created').on(table.createdAt)
  })
)

// Type exports for use in application code
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type SavedChart = typeof savedCharts.$inferSelect
export type NewSavedChart = typeof savedCharts.$inferInsert

export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert

export type WebhookEvent = typeof webhookEvents.$inferSelect
export type NewWebhookEvent = typeof webhookEvents.$inferInsert

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert

export type DataQualityOverride = typeof dataQualityOverrides.$inferSelect
export type NewDataQualityOverride = typeof dataQualityOverrides.$inferInsert

export type InviteCode = typeof inviteCodes.$inferSelect
export type NewInviteCode = typeof inviteCodes.$inferInsert

export type Chart = typeof charts.$inferSelect
export type NewChart = typeof charts.$inferInsert
