import { logger } from '../utils/logger'

/**
 * Nitro plugin to initialize database on server startup
 * Runs init.sql to ensure tables exist
 */
export default defineNitroPlugin(async () => {
  try {
    logger.info('DB init plugin starting')

    // Dynamic imports to avoid bundling issues
    const Database = (await import('better-sqlite3')).default
    const { resolve, dirname } = await import('node:path')
    const { existsSync, mkdirSync, readFileSync } = await import('node:fs')

    // In production/preview mode, cwd is .output, so we need to go up one level
    const isPreviewMode = process.cwd().endsWith('.output')
    const rootDir = isPreviewMode ? resolve(process.cwd(), '..') : process.cwd()

    const dbPath = resolve(rootDir, '.data/mortality.db')
    const initSqlPath = resolve(rootDir, 'db/init.sql')

    // Check if init.sql exists
    if (!existsSync(initSqlPath)) {
      logger.warn('Database init.sql not found, skipping initialization', {
        expectedPath: initSqlPath
      })
      return
    }

    logger.info('Initializing database', {
      rootDir,
      dbPath,
      initSqlPath
    })

    // Ensure the .data directory exists
    const dir = dirname(dbPath)
    try {
      mkdirSync(dir, { recursive: true })
    } catch {
      // Directory already exists
    }

    const sqlite = new Database(dbPath)

    // Read and execute init.sql
    logger.info('Running init.sql')
    const initSql = readFileSync(initSqlPath, 'utf-8')
    sqlite.exec(initSql)
    logger.info('Database tables created/verified')

    // Force WAL checkpoint to ensure changes are written to main database file
    try {
      sqlite.pragma('wal_checkpoint(FULL)')
    } catch {
      // WAL checkpoint failed - OK if WAL is not enabled
    }

    sqlite.close()
    logger.info('Database initialized successfully')
  } catch (error) {
    logger.error('FATAL: Failed to initialize database', error instanceof Error ? error : new Error(String(error)))
    // Don't throw - allow server to start even if init fails
  }
})
