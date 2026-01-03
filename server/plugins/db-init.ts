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

    // Run migrations for columns that may not exist in older databases
    const columnMigrations = [
      { column: 'google_id', sql: 'ALTER TABLE users ADD COLUMN google_id TEXT' },
      { column: 'twitter_id', sql: 'ALTER TABLE users ADD COLUMN twitter_id TEXT' },
      { column: 'profile_picture_url', sql: 'ALTER TABLE users ADD COLUMN profile_picture_url TEXT' }
    ]

    for (const migration of columnMigrations) {
      try {
        // Check if column exists
        const columns = sqlite.pragma('table_info(users)') as { name: string }[]
        const columnExists = columns.some(col => col.name === migration.column)
        if (!columnExists) {
          sqlite.exec(migration.sql)
          logger.info(`Added column ${migration.column} to users table`)
        }
      } catch {
        // Column might already exist or migration failed - ignore
      }
    }

    // Create indexes for OAuth columns (safe to run multiple times with IF NOT EXISTS)
    try {
      sqlite.exec('CREATE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id)')
      sqlite.exec('CREATE INDEX IF NOT EXISTS idx_users_twitter_id ON users (twitter_id)')
    } catch {
      // Indexes might already exist or columns don't exist yet - ignore
    }

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
