import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'humasbpkh.db')

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')
  }
  return _db
}

export default getDb

export function query(sql: string, params?: any[]): any[] {
  const db = getDb()
  const stmt = db.prepare(sql)
  if (params && params.length > 0) {
    const result = stmt.run(...params)
    return result.changes !== undefined ? [result as any] : stmt.all()
  }
  try {
    return stmt.all()
  } catch {
    return []
  }
}

export function run(sql: string, params?: any[]): Database.RunResult {
  const db = getDb()
  if (params && params.length > 0) {
    return db.prepare(sql).run(...params)
  }
  return db.prepare(sql).run()
}
