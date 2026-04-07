import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/checkAuth'
import getDb from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const db = getDb()
    const rows = db.prepare('SELECT * FROM sociapulse_kampanye ORDER BY created_at DESC').all()
    return NextResponse.json({ data: rows })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { nama, deskripsi, tanggal_mulai, tanggal_selesai } = await req.json()
    if (!nama) return NextResponse.json({ error: 'Nama kampanye wajib' }, { status: 400 })
    const db = getDb()
    const result = db.prepare('INSERT INTO sociapulse_kampanye (nama, deskripsi, tanggal_mulai, tanggal_selesai) VALUES (?, ?, ?, ?)').run(nama, deskripsi || null, tanggal_mulai || null, tanggal_selesai || null)
    return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
