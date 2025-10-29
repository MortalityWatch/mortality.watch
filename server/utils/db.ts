import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../../db/schema'

/**
 * Database connection for server-side operations
 */

const DB_PATH = './.data/mortality.db'

// Create singleton database connection
let _db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!_db) {
    const sqlite = new Database(DB_PATH)
    sqlite.pragma('journal_mode = WAL') // Enable Write-Ahead Logging for better performance
    _db = drizzle(sqlite, { schema })
  }
  return _db
}

// Export db instance
export const db = getDb()
