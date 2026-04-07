import getDb from './db'

export async function logActivity({ userId, modul, action, description, ipAddress }: {
  userId?: number
  modul: string
  action: string
  description?: string
  ipAddress?: string
}) {
  try {
    const db = getDb()
    db.prepare('INSERT INTO activity_logs (user_id, modul, action, description, ip_address) VALUES (?, ?, ?, ?, ?)')
      .run(userId || null, modul, action, description || null, ipAddress || null)
  } catch {}
}
