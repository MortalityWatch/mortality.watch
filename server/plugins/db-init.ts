import { logger } from '../utils/logger'

/**
 * Nitro plugin to initialize database on server startup
 * Runs migrations automatically to ensure tables exist
 */
export default defineNitroPlugin(async () => {
  try {
    logger.info('DB init plugin starting')

    // Dynamic imports to avoid bundling issues
    const { drizzle } = await import('drizzle-orm/better-sqlite3')
    const { migrate } = await import('drizzle-orm/better-sqlite3/migrator')
    const Database = (await import('better-sqlite3')).default
    const { resolve, dirname } = await import('node:path')
    const { existsSync, mkdirSync } = await import('node:fs')

    logger.debug('Imports successful')

    // In production/preview mode, cwd is .output, so we need to go up one level
    const isPreviewMode = process.cwd().endsWith('.output')
    const rootDir = isPreviewMode ? resolve(process.cwd(), '..') : process.cwd()

    const dbPath = resolve(rootDir, '.data/mortality.db')
    const migrationsPath = resolve(rootDir, 'db/migrations')

    logger.debug('Paths resolved', {
      isPreviewMode,
      rootDir,
      dbPath,
      migrationsPath
    })

    // Check if migrations directory exists
    if (!existsSync(migrationsPath)) {
      logger.warn('Database migrations directory not found, skipping migration', {
        expectedPath: migrationsPath
      })
      return
    }

    logger.info('Initializing database', {
      rootDir,
      dbPath,
      migrationsPath
    })

    // Ensure the .data directory exists
    const dir = dirname(dbPath)
    try {
      mkdirSync(dir, { recursive: true })
      logger.debug('Created directory', { dir })
    } catch {
      logger.debug('Directory already exists or cannot be created', { dir })
    }

    logger.debug('Opening database connection')
    const sqlite = new Database(dbPath)
    const db = drizzle(sqlite)

    logger.info('Running migrations')
    try {
      migrate(db, { migrationsFolder: migrationsPath })
      logger.info('Migrations completed successfully')
    } catch (migrationError) {
      logger.error('Migration error', migrationError instanceof Error ? migrationError : new Error(String(migrationError)))
      throw migrationError
    }

    logger.debug('Closing database connection')

    // Force WAL checkpoint to ensure changes are written to main database file
    try {
      sqlite.pragma('wal_checkpoint(FULL)')
      logger.debug('WAL checkpoint completed')
    } catch (checkpointError) {
      logger.debug('WAL checkpoint failed (this is OK if WAL is not enabled)', {
        error: checkpointError
      })
    }

    sqlite.close()
    logger.info('Database initialized successfully')
  } catch (error) {
    logger.error('FATAL: Failed to initialize database', error instanceof Error ? error : new Error(String(error)))
    // Don't throw - allow server to start even if migrations fail
    // This prevents breaking the app if migrations have already run
  }
})
