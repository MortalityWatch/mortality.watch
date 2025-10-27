import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { resolve } from 'path'
import * as schema from './schema'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'

const dbPath = resolve(process.cwd(), '.data/mortality.db')

// Lazy-load database to avoid initialization errors during build/prerender
let sqlite: Database.Database | null = null
let drizzleDb: BetterSQLite3Database<typeof schema> | null = null

function initDb() {
  if (!drizzleDb) {
    sqlite = new Database(dbPath)
    // Enable WAL mode for better concurrent access
    sqlite.pragma('journal_mode = WAL')
    drizzleDb = drizzle(sqlite, { schema })
  }
  return drizzleDb
}

// Export lazy-loaded db instance via getter
export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_target, prop) {
    const db = initDb()
    return db[prop as keyof BetterSQLite3Database<typeof schema>]
  }
})

// Export schema for convenience
export * from './schema'

// Helper function to close the database connection (for tests or cleanup)
export function closeDb() {
  if (sqlite) {
    sqlite.close()
    sqlite = null
    drizzleDb = null
  }
}
