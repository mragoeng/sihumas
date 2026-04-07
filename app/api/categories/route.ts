import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/checkAuth'
import getDb from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const modul = searchParams.get('modul')

  try {
    const db = getDb()
    let rows: any[]
    if (modul) {
      rows = db.prepare('SELECT * FROM categories WHERE modul = ? AND is_active = 1 ORDER BY sort_order').all(modul)
    } else {
      rows = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY modul, sort_order').all()
    }
    return NextResponse.json({ data: rows })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { modul, nama, icon, color, sort_order } = await req.json()
    if (!modul || !nama) return NextResponse.json({ error: 'Modul dan nama wajib' }, { status: 400 })

    const db = getDb()
    const result = db.prepare('INSERT INTO categories (modul, nama, icon, color, sort_order) VALUES (?, ?, ?, ?, ?)')
      .run(modul, nama, icon || null, color || null, sort_order || 0)
    return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
