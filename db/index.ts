import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { resolve } from 'path'
import * as schema from './schema'

const dbPath = resolve(process.cwd(), '.data/mortality.db')

// Create SQLite database connection
const sqlite = new Database(dbPath)

// Enable WAL mode for better concurrent access
sqlite.pragma('journal_mode = WAL')

// Create Drizzle instance
export const db = drizzle(sqlite, { schema })

// Export schema for convenience
export * from './schema'

// Helper function to close the database connection (for tests or cleanup)
export function closeDb() {
  sqlite.close()
}
