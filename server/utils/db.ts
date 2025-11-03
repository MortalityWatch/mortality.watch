import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import * as schema from '../../db/schema'

/**
 * Database connection for server-side operations
 */

// Use absolute path based on process working directory
// In preview/production mode, cwd is .output, so go up one level to project root
const isPreviewMode = process.cwd().endsWith('.output')
const rootDir = isPreviewMode ? resolve(process.cwd(), '..') : process.cwd()
const DB_PATH = resolve(rootDir, '.data/mortality.db')

// Create singleton database connection
let _db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!_db) {
    // Ensure the .data directory exists
    const dir = dirname(DB_PATH)
    try {
      mkdirSync(dir, { recursive: true })
    } catch {
      // Directory already exists or cannot be created
    }

    const sqlite = new Database(DB_PATH)
    sqlite.pragma('journal_mode = WAL') // Enable Write-Ahead Logging for better performance
    _db = drizzle(sqlite, { schema })
  }
  return _db
}

// Export db instance
export const db = getDb()
