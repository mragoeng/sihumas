import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/checkAuth'
import getDb from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const offset = (page - 1) * limit

    const db = getDb()
    let rows: any[]
    let total: number

    let where = 'WHERE 1=1'
    const params: any[] = []
    if (search) { where += ' AND k.judul LIKE ?'; params.push(`%${search}%`) }
    if (status) { where += ' AND k.status = ?'; params.push(status) }

    rows = db.prepare(`SELECT k.*, ck.nama as kampanye_nama FROM sociapulse_konten k LEFT JOIN sociapulse_kampanye ck ON k.kampanye_id = ck.id ${where} ORDER BY k.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset)
    total = (db.prepare(`SELECT COUNT(*) as total FROM sociapulse_konten k ${where}`).get(...params) as any).total

    for (const row of rows) {
      row.platforms = db.prepare('SELECT * FROM sociapulse_platforms WHERE konten_id = ?').all(row.id)
      row.metrics_count = (db.prepare('SELECT COUNT(*) as c FROM sociapulse_metrics WHERE konten_id = ?').get(row.id) as any).c
    }

    return NextResponse.json({ data: rows, total, page, limit })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { judul, content_type, caption, hashtags, tanggal_post, notes, kampanye_id, platforms } = await req.json()
    if (!judul) return NextResponse.json({ error: 'Judul wajib' }, { status: 400 })

    const db = getDb()
    const result = db.prepare('INSERT INTO sociapulse_konten (judul, content_type, caption, hashtags, tanggal_post, notes, kampanye_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(judul, content_type || null, caption || null, hashtags || null, tanggal_post || null, notes || null, kampanye_id || null)

    if (platforms && platforms.length > 0) {
      const ins = db.prepare('INSERT INTO sociapulse_platforms (konten_id, platform) VALUES (?, ?)')
      for (const p of platforms) { ins.run(result.lastInsertRowid, p) }
    }

    const { logActivity } = await import('@/lib/logger')
    await logActivity({ userId: user.userId, modul: 'sociapulse', action: 'create', description: `Konten "${judul}" dibuat` })

    return NextResponse.json({ id: result.lastInsertRowid, message: 'Konten berhasil dibuat' }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
