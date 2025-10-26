import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import Database from 'better-sqlite3'
import { resolve } from 'path'

const dbPath = resolve(process.cwd(), '.data/mortality.db')
const migrationsPath = resolve(process.cwd(), 'db/migrations')

console.log('Running database migrations...')
console.log(`Database path: ${dbPath}`)
console.log(`Migrations path: ${migrationsPath}`)

const sqlite = new Database(dbPath)
const db = drizzle(sqlite)

migrate(db, { migrationsFolder: migrationsPath })

console.log('Migrations completed successfully!')

sqlite.close()
