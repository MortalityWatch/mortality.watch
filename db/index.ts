import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { resolve } from 'path'
import * as schema from './schema'

const dbPath = resolve(process.cwd(), '.data/mortality.db')

let sqliteInstance: Database.Database | null = null
let dbInstance: ReturnType<typeof drizzle> | null = null

// Lazy initialization - only connect when needed
function getDb() {
  if (!dbInstance) {
    // Create SQLite database connection
    sqliteInstance = new Database(dbPath)

    // Enable WAL mode for better concurrent access
    sqliteInstance.pragma('journal_mode = WAL')

    // Create Drizzle instance
    dbInstance = drizzle(sqliteInstance, { schema })
  }
  return dbInstance
}

// Export a getter instead of the instance directly
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>]
  }
})

// Export schema for convenience
export * from './schema'

// Helper function to close the database connection (for tests or cleanup)
export function closeDb() {
  if (sqliteInstance) {
    sqliteInstance.close()
    sqliteInstance = null
    dbInstance = null
  }
}
