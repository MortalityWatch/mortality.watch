-- Database initialization script
-- Run with: sqlite3 .data/mortality.db < db/init.sql

-- Users table (must be created before tables that reference it)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  name TEXT,
  role TEXT DEFAULT 'user' NOT NULL,
  tier INTEGER DEFAULT 1 NOT NULL,
  email_verified INTEGER DEFAULT 0 NOT NULL,
  verification_token TEXT,
  verification_token_expires INTEGER,
  password_reset_token TEXT,
  password_reset_token_expires INTEGER,
  tos_accepted_at INTEGER,
  last_login INTEGER,
  invited_by_code_id INTEGER,
  google_id TEXT,
  twitter_id TEXT,
  profile_picture_url TEXT,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users (tier);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_verification_token ON users (verification_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON users (password_reset_token);
-- OAuth indexes created via db-init.ts migrations

-- Invite codes table
CREATE TABLE IF NOT EXISTS invite_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_by INTEGER REFERENCES users(id),
  max_uses INTEGER DEFAULT 1 NOT NULL,
  current_uses INTEGER DEFAULT 0 NOT NULL,
  expires_at INTEGER,
  grants_pro_until INTEGER,
  notes TEXT,
  is_active INTEGER DEFAULT 1 NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes (code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_active ON invite_codes (is_active);
CREATE INDEX IF NOT EXISTS idx_invite_codes_expires ON invite_codes (expires_at);

-- Charts table (canonical storage for chart configurations)
CREATE TABLE IF NOT EXISTS charts (
  id TEXT PRIMARY KEY NOT NULL,
  config TEXT NOT NULL,
  page TEXT DEFAULT 'explorer' NOT NULL,
  create_count INTEGER DEFAULT 1 NOT NULL,
  access_count INTEGER DEFAULT 0 NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  last_accessed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_charts_page ON charts (page);
CREATE INDEX IF NOT EXISTS idx_charts_created ON charts (created_at);

-- Saved charts table (user bookmarks with metadata)
CREATE TABLE IF NOT EXISTS saved_charts (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chart_id TEXT NOT NULL REFERENCES charts(id),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_featured INTEGER DEFAULT 0 NOT NULL,
  is_public INTEGER DEFAULT 0 NOT NULL,
  slug TEXT UNIQUE,
  view_count INTEGER DEFAULT 0 NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_charts_user ON saved_charts (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_charts_chart ON saved_charts (chart_id);
CREATE INDEX IF NOT EXISTS idx_saved_charts_featured ON saved_charts (is_featured);
CREATE INDEX IF NOT EXISTS idx_saved_charts_public ON saved_charts (is_public);
CREATE INDEX IF NOT EXISTS idx_saved_charts_slug ON saved_charts (slug);
CREATE INDEX IF NOT EXISTS idx_saved_charts_created ON saved_charts (created_at);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT DEFAULT 'inactive' NOT NULL,
  plan TEXT,
  plan_price_id TEXT,
  current_period_start INTEGER,
  current_period_end INTEGER,
  cancel_at_period_end INTEGER DEFAULT 0 NOT NULL,
  canceled_at INTEGER,
  trial_end INTEGER,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions (current_period_end);

-- Webhook events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  processed INTEGER DEFAULT 0 NOT NULL,
  processing_error TEXT,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  processed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON webhook_events (stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events (event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events (processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events (created_at);

-- Data quality overrides table
CREATE TABLE IF NOT EXISTS data_quality_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  iso3c TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT DEFAULT 'monitor' NOT NULL,
  notes TEXT,
  updated_by INTEGER REFERENCES users(id),
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_data_quality_unique ON data_quality_overrides (iso3c, source);
CREATE INDEX IF NOT EXISTS idx_data_quality_status ON data_quality_overrides (status);
