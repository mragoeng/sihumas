import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/checkAuth'
import getDb from '@/lib/db'
import { verifyToken } from '@/lib/auth'


export async function GET(req: NextRequest) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * limit

    const db = getDb()

    let rows: any[]
    let total: number

    if (search) {
      rows = db.prepare(
        'SELECT a.*, c.nama as kategori_nama FROM arkiven_arsip a LEFT JOIN categories c ON a.kategori_id = c.id WHERE a.judul LIKE ? ORDER BY a.created_at DESC LIMIT ? OFFSET ?'
      ).all(`%${search}%`, limit, offset)
      total = (db.prepare('SELECT COUNT(*) as total FROM arkiven_arsip WHERE judul LIKE ?').get(`%${search}%`) as any).total
    } else {
      rows = db.prepare(
        'SELECT a.*, c.nama as kategori_nama FROM arkiven_arsip a LEFT JOIN categories c ON a.kategori_id = c.id ORDER BY a.created_at DESC LIMIT ? OFFSET ?'
      ).all(limit, offset)
      total = (db.prepare('SELECT COUNT(*) as total FROM arkiven_arsip').get() as any).total
    }

    for (const row of rows) {
      row.files = db.prepare('SELECT * FROM arkiven_files WHERE arsip_id = ?').all((row as any).id)
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
    const { judul, kategori_id, tanggal, deskripsi } = await req.json()

    if (!judul || !tanggal) {
      return NextResponse.json({ error: 'Judul dan tanggal wajib diisi' }, { status: 400 })
    }

    const db = getDb()
    const result = db.prepare(
      'INSERT INTO arkiven_arsip (judul, kategori_id, tanggal, deskripsi) VALUES (?, ?, ?, ?)'
    ).run(judul, kategori_id || null, tanggal, deskripsi || null)

    const { logActivity } = await import('@/lib/logger')
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    await logActivity({ userId: user.userId, modul: 'arkiven', action: 'create', description: `Arsip "${judul}" dibuat`, ipAddress: ip })

    return NextResponse.json({ id: result.lastInsertRowid, message: 'Arsip berhasil dibuat' }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
