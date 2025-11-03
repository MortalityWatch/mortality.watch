/**
 * Nitro plugin to initialize database on server startup
 * Runs migrations automatically to ensure tables exist
 */
export default defineNitroPlugin(async () => {
  try {
    console.log('[db-init] Plugin starting...')

    // Dynamic imports to avoid bundling issues
    const { drizzle } = await import('drizzle-orm/better-sqlite3')
    const { migrate } = await import('drizzle-orm/better-sqlite3/migrator')
    const Database = (await import('better-sqlite3')).default
    const { resolve, dirname } = await import('node:path')
    const { existsSync, mkdirSync } = await import('node:fs')

    console.log('[db-init] Imports successful')

    // In production/preview mode, cwd is .output, so we need to go up one level
    const isPreviewMode = process.cwd().endsWith('.output')
    const rootDir = isPreviewMode ? resolve(process.cwd(), '..') : process.cwd()

    const dbPath = resolve(rootDir, '.data/mortality.db')
    const migrationsPath = resolve(rootDir, 'db/migrations')

    console.log('[db-init] Paths resolved')
    console.log(`[db-init] isPreviewMode: ${isPreviewMode}`)
    console.log(`[db-init] rootDir: ${rootDir}`)
    console.log(`[db-init] dbPath: ${dbPath}`)
    console.log(`[db-init] migrationsPath: ${migrationsPath}`)

    // Check if migrations directory exists
    if (!existsSync(migrationsPath)) {
      console.warn('[db-init] Database migrations directory not found, skipping migration')
      console.warn(`[db-init] Expected path: ${migrationsPath}`)
      return
    }

    console.log('[db-init] Migrations directory exists')
    console.log('Initializing database...')
    console.log(`Root directory: ${rootDir}`)
    console.log(`Database path: ${dbPath}`)
    console.log(`Migrations path: ${migrationsPath}`)

    // Ensure the .data directory exists
    const dir = dirname(dbPath)
    try {
      mkdirSync(dir, { recursive: true })
      console.log(`Created directory: ${dir}`)
    } catch {
      console.log(`Directory already exists or cannot be created: ${dir}`)
    }

    console.log('Opening database connection...')
    const sqlite = new Database(dbPath)
    const db = drizzle(sqlite)

    console.log('Running migrations...')
    try {
      migrate(db, { migrationsFolder: migrationsPath })
      console.log('Migrations completed successfully')
    } catch (migrationError) {
      console.error('Migration error:', migrationError)
      throw migrationError
    }

    console.log('[db-init] Closing database connection...')

    // Force WAL checkpoint to ensure changes are written to main database file
    try {
      sqlite.pragma('wal_checkpoint(FULL)')
      console.log('[db-init] WAL checkpoint completed')
    } catch (checkpointError) {
      console.warn('[db-init] WAL checkpoint failed (this is OK if WAL is not enabled):', checkpointError)
    }

    sqlite.close()
    console.log('[db-init] Database initialized successfully')
  } catch (error) {
    console.error('[db-init] FATAL: Failed to initialize database:', error)
    if (error instanceof Error) {
      console.error('[db-init] Error name:', error.name)
      console.error('[db-init] Error message:', error.message)
      console.error('[db-init] Error stack:', error.stack)
    }
    // Don't throw - allow server to start even if migrations fail
    // This prevents breaking the app if migrations have already run
  }
})
