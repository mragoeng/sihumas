import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/checkAuth'
import getDb from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const db = getDb()
    const rows: any = db.prepare('SELECT setting_key, setting_value FROM settings').all()
    const settings: Record<string, string> = {}
    for (const row of rows) {
      settings[row.setting_key] = row.setting_value || ''
    }
    return NextResponse.json(settings)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await req.json()
    const db = getDb()
    const upsert = db.prepare(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT(setting_key) DO UPDATE SET setting_value = ?'
    )
    for (const [key, value] of Object.entries(data)) {
      upsert.run(key, value, value)
    }
    return NextResponse.json({ message: 'Settings disimpan' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
