import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/checkAuth'
import getDb from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const modul = searchParams.get('modul')
    const action = searchParams.get('action')
    const date = searchParams.get('date')
    const limit = Number(searchParams.get('limit')) || 50
    const offset = Number(searchParams.get('offset')) || 0

    const db = getDb()
    let sql = 'SELECT * FROM activity_logs WHERE 1=1'
    const params: any[] = []

    if (modul) { sql += ' AND modul = ?'; params.push(modul) }
    if (action) { sql += ' AND action = ?'; params.push(action) }
    if (date) { sql += ' AND DATE(created_at) = ?'; params.push(date) }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const rows = db.prepare(sql).all(...params)
    return NextResponse.json({ data: rows })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
