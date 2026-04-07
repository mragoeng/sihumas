import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/checkAuth'
import getDb from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const db = getDb()
    const row: any = db.prepare('SELECT m.*, c.nama as kategori_nama FROM pressport_media m LEFT JOIN categories c ON m.kategori_id = c.id WHERE m.id = ?').get(params.id)
    if (!row) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
    row.files = db.prepare('SELECT * FROM pressport_files WHERE media_id = ?').all(params.id)
    return NextResponse.json(row)
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { judul, kategori_id, tanggal, deskripsi } = await req.json()
    const db = getDb()
    db.prepare('UPDATE pressport_media SET judul=?, kategori_id=?, tanggal=?, deskripsi=? WHERE id=?').run(judul, kategori_id || null, tanggal, deskripsi || null, params.id)
    return NextResponse.json({ message: 'Media berhasil diupdate' })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const db = getDb()
    db.prepare('DELETE FROM pressport_media WHERE id = ?').run(params.id)
    return NextResponse.json({ message: 'Media berhasil dihapus' })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
