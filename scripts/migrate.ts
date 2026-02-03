import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { resolve } from 'path'
import { existsSync, readFileSync } from 'fs'
import { createHash } from 'crypto'

const dbPath = resolve(process.cwd(), '.data/mortality.db')
const migrationsPath = resolve(process.cwd(), 'db/migrations')

console.log('Running database migrations...')
console.log(`Database path: ${dbPath}`)
console.log(`Migrations path: ${migrationsPath}`)

// Check if migrations folder exists
if (!existsSync(migrationsPath)) {
  console.error('Migrations folder not found:', migrationsPath)
  process.exit(1)
}

// Create database connection
const sqlite = new Database(dbPath)
const db = drizzle(sqlite)

// Read the drizzle journal to get migration metadata
interface JournalEntry {
  idx: number
  version: string
  when: number
  tag: string
  breakpoints: boolean
}

interface Journal {
  version: string
  dialect: string
  entries: JournalEntry[]
}

function readJournal(): Journal {
  const journalPath = resolve(migrationsPath, 'meta', '_journal.json')
  if (!existsSync(journalPath)) {
    throw new Error('Migration journal not found')
  }
  return JSON.parse(readFileSync(journalPath, 'utf-8'))
}

function computeMigrationHash(sqlContent: string): string {
  return createHash('sha256').update(sqlContent).digest('hex')
}

// Check if this is a legacy database (created via init.sql, not drizzle migrations)
// If so, we need to mark the applied migrations in the journal
function markLegacyMigrationsApplied() {
  // Check if the drizzle migrations table exists
  const hasJournal = sqlite.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='__drizzle_migrations'
  `).get()

  if (hasJournal) {
    return // Already using drizzle migrations
  }

  // Check if this is a legacy database by looking for the users table
  const hasUsers = sqlite.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='users'
  `).get()

  if (!hasUsers) {
    return // Fresh database, let drizzle handle it
  }

  console.log('Legacy database detected, initializing migration journal...')

  // Create the drizzle migrations table with the correct schema
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY,
      hash TEXT NOT NULL,
      created_at INTEGER
    )
  `)

  // Read the journal to get migration info
  const journal = readJournal()

  // Check each migration and mark it as applied if the DB already has those changes
  for (const entry of journal.entries) {
    const sqlPath = resolve(migrationsPath, `${entry.tag}.sql`)
    if (!existsSync(sqlPath)) {
      console.warn(`  Migration file not found: ${entry.tag}.sql`)
      continue
    }

    const sqlContent = readFileSync(sqlPath, 'utf-8')
    const hash = computeMigrationHash(sqlContent)

    // Check what this migration does and if it's already applied
    let isApplied = false

    if (entry.tag === '0000_funny_silver_samurai') {
      // Initial schema - check if users table exists (it does for legacy DBs)
      isApplied = true
    } else if (entry.tag === '0001_curious_triathlon') {
      // pending_email columns - check if they exist
      const cols = sqlite.pragma('table_info(users)') as Array<{ name: string }>
      isApplied = cols.some(c => c.name === 'pending_email')
    }

    if (isApplied) {
      console.log(`  Marking ${entry.tag} as applied`)
      sqlite.prepare(`
        INSERT INTO __drizzle_migrations (hash, created_at)
        VALUES (?, ?)
      `).run(hash, entry.when)
    }
  }
}

try {
  // Handle legacy databases
  markLegacyMigrationsApplied()

  // Run any pending migrations
  migrate(db, { migrationsFolder: migrationsPath })
  console.log('Migrations completed successfully!')
} catch (error) {
  console.error('Migration failed:', error)
  process.exit(1)
} finally {
  sqlite.close()
}
