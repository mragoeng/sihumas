import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/checkAuth'
import getDb from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { platform, likes, comments, shares, reach, views, saves, notes } = await req.json()
    const db = getDb()
    const today = new Date().toISOString().split('T')[0]
    db.prepare('INSERT INTO sociapulse_metrics (konten_id, platform, tanggal_cek, likes, comments, shares, reach, views, saves, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(params.id, platform || null, today, likes || 0, comments || 0, shares || 0, reach || 0, views || 0, saves || 0, notes || null)
    return NextResponse.json({ message: 'Metrics disimpan' }, { status: 201 })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
