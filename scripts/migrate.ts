import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const dbPath = resolve(process.cwd(), '.data/mortality.db')
const initSqlPath = resolve(process.cwd(), 'db/init.sql')

console.log('Running database initialization...')
console.log(`Database path: ${dbPath}`)

const sqlite = new Database(dbPath)

// Read and execute init.sql
const initSql = readFileSync(initSqlPath, 'utf-8')
sqlite.exec(initSql)

console.log('Database initialized successfully!')

sqlite.close()
