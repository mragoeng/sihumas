import { NextRequest, NextResponse } from 'next/server'
import getDb from '@/lib/db'
import { checkAuth } from '@/lib/checkAuth'

export async function GET(req: NextRequest, { params }: { params: { modul: string } }) {
  const user = await checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'json'
    const dari = searchParams.get('dari')
    const sampai = searchParams.get('sampai')
    const db = getDb()

    let where = ''
    const p: any[] = []
    if (dari) { where += ' AND tanggal >= ?'; p.push(dari) }
    if (sampai) { where += ' AND tanggal <= ?'; p.push(sampai) }

    let rows: any[]
    if (params.modul === 'arkiven') {
      rows = db.prepare(`SELECT a.*, c.nama as kategori_nama FROM arkiven_arsip a LEFT JOIN categories c ON a.kategori_id = c.id WHERE 1=1${where} ORDER BY a.tanggal DESC`).all(...p)
      for (const r of rows) r.files = db.prepare('SELECT * FROM arkiven_files WHERE arsip_id = ?').all(r.id)
    } else if (params.modul === 'pressport') {
      rows = db.prepare(`SELECT m.*, c.nama as kategori_nama FROM pressport_media m LEFT JOIN categories c ON m.kategori_id = c.id WHERE 1=1${where} ORDER BY m.tanggal DESC`).all(...p)
      for (const r of rows) r.files = db.prepare('SELECT * FROM pressport_files WHERE media_id = ?').all(r.id)
    } else if (params.modul === 'sociapulse') {
      rows = db.prepare(`SELECT k.*, ck.nama as kampanye_nama FROM sociapulse_konten k LEFT JOIN sociapulse_kampanye ck ON k.kampanye_id = ck.id WHERE 1=1${where} ORDER BY k.created_at DESC`).all(...p)
      for (const r of rows) {
        r.platforms = db.prepare('SELECT * FROM sociapulse_platforms WHERE konten_id = ?').all(r.id)
        r.metrics = db.prepare('SELECT * FROM sociapulse_metrics WHERE konten_id = ? ORDER BY tanggal_cek DESC LIMIT 1').all(r.id)
      }
    } else {
      return NextResponse.json({ error: 'Modul tidak valid' }, { status: 400 })
    }

    if (format === 'csv') {
      const csv = toCSV(rows, params.modul)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="laporan-${params.modul}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({ data: rows, modul: params.modul, total: rows.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function toCSV(rows: any[], modul: string): string {
  if (rows.length === 0) return 'Tidak ada data'

  const headers = Object.keys(rows[0]).filter(k => !['files', 'platforms', 'metrics'].includes(k))
  const lines: string[] = [headers.join(',')]

  for (const row of rows) {
    const vals = headers.map(h => {
      const v = row[h]
      if (v === null || v === undefined) return ''
      const s = String(v).replace(/"/g, '""')
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
    })
    lines.push(vals.join(','))
  }

  return lines.join('\n')
}
