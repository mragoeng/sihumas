import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/checkAuth'
import getDb from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const db = getDb()
    const row: any = db.prepare(
      'SELECT a.*, c.nama as kategori_nama FROM arkiven_arsip a LEFT JOIN categories c ON a.kategori_id = c.id WHERE a.id = ?'
    ).get(params.id)

    if (!row) return NextResponse.json({ error: 'Arsip tidak ditemukan' }, { status: 404 })

    row.files = db.prepare('SELECT * FROM arkiven_files WHERE arsip_id = ?').all(params.id)
    return NextResponse.json(row)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { judul, kategori_id, tanggal, deskripsi } = await req.json()
    const db = getDb()
    db.prepare('UPDATE arkiven_arsip SET judul=?, kategori_id=?, tanggal=?, deskripsi=? WHERE id=?')
      .run(judul, kategori_id || null, tanggal, deskripsi || null, params.id)

    const { logActivity } = await import('@/lib/logger')
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    await logActivity({ userId: user.userId, modul: 'arkiven', action: 'update', description: `Arsip #${params.id} diupdate`, ipAddress: ip })

    return NextResponse.json({ message: 'Arsip berhasil diupdate' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const db = getDb()
    db.prepare('DELETE FROM arkiven_arsip WHERE id = ?').run(params.id)

    const { logActivity } = await import('@/lib/logger')
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    await logActivity({ userId: user.userId, modul: 'arkiven', action: 'delete', description: `Arsip #${params.id} dihapus`, ipAddress: ip })

    return NextResponse.json({ message: 'Arsip berhasil dihapus' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
