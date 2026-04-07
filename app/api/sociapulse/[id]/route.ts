import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/checkAuth'
import getDb from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const db = getDb()
    const row: any = db.prepare('SELECT k.*, ck.nama as kampanye_nama FROM sociapulse_konten k LEFT JOIN sociapulse_kampanye ck ON k.kampanye_id = ck.id WHERE k.id = ?').get(params.id)
    if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
    row.platforms = db.prepare('SELECT * FROM sociapulse_platforms WHERE konten_id = ?').all(params.id)
    row.metrics = db.prepare('SELECT * FROM sociapulse_metrics WHERE konten_id = ? ORDER BY tanggal_cek DESC').all(params.id)
    row.assets = db.prepare('SELECT * FROM sociapulse_assets WHERE konten_id = ?').all(params.id)
    return NextResponse.json(row)
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { judul, content_type, status, caption, hashtags, tanggal_post, notes, kampanye_id } = body
    const db = getDb()
    db.prepare('UPDATE sociapulse_konten SET judul=?, content_type=?, status=?, caption=?, hashtags=?, tanggal_post=?, notes=?, kampanye_id=? WHERE id=?')
      .run(judul, content_type || null, status || 'ide', caption || null, hashtags || null, tanggal_post || null, notes || null, kampanye_id || null, params.id)
    return NextResponse.json({ message: 'Konten diupdate' })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const db = getDb()
    db.prepare('DELETE FROM sociapulse_konten WHERE id = ?').run(params.id)
    return NextResponse.json({ message: 'Konten dihapus' })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
