'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Konten {
  id: number; judul: string; content_type: string; status: string; caption: string; hashtags: string
  tanggal_post: string; notes: string; kampanye_id: number; kampanye_nama: string
  platforms: { id: number; platform: string; link_post: string; posted_at: string }[]
  metrics: { id: number; platform: string; tanggal_cek: string; likes: number; comments: number; shares: number; reach: number; views: number; saves: number }[]
  assets: { id: number; nama: string; kategori: string; file_name: string }[]
}

const statusList = ['ide', 'draft', 'review', 'approved', 'scheduled', 'published']
const statusColors: Record<string, string> = {
  ide: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  draft: 'bg-yellow-200 text-yellow-800',
  review: 'bg-orange-200 text-orange-800',
  approved: 'bg-blue-200 text-blue-800',
  scheduled: 'bg-purple-200 text-purple-800',
  published: 'bg-green-200 text-green-800',
}

export default function SociapulseDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<Konten | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [showMetrics, setShowMetrics] = useState(false)
  const [metricsForm, setMetricsForm] = useState({ platform: 'instagram', likes: 0, comments: 0, shares: 0, reach: 0, views: 0, saves: 0 })
  const router = useRouter()
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  useEffect(() => {
    if (!token) { router.push('/'); return }
    fetch(`/api/sociapulse/${params.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setData(d)).catch(() => {}).finally(() => setLoading(false))
  }, [params.id])

  const updateStatus = async (status: string) => {
    if (!data) return
    const res = await fetch(`/api/sociapulse/${params.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...data, status })
    })
    if (res.ok) { setData({ ...data, status }); setMsg({ type: 'ok', text: `Status → ${status}` }) }
  }

  const submitMetrics = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`/api/sociapulse/${params.id}/metrics`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(metricsForm)
    })
    if (res.ok) {
      setMsg({ type: 'ok', text: 'Metrics disimpan!' })
      setShowMetrics(false)
      // Refresh data
      const d = await (await fetch(`/api/sociapulse/${params.id}`, { headers: { Authorization: `Bearer ${token}` } })).json()
      setData(d)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Hapus konten ini?')) return
    await fetch(`/api/sociapulse/${params.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    router.push('/sociapulse')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
  if (!data) return <div className="min-h-screen flex items-center justify-center text-gray-500">Tidak ditemukan</div>

  const totalEngagement = data.metrics?.length > 0 ? data.metrics[0].likes + data.metrics[0].comments + data.metrics[0].shares : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1B1B1B]">
      <header className="bg-white dark:bg-[#2a2a2a] shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/sociapulse" className="text-gray-500 hover:text-blue-600">←</Link>
            <h1 className="text-lg font-bold text-blue-600 truncate max-w-md">{data.judul}</h1>
          </div>
          <button onClick={handleDelete} className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition">🗑️ Hapus</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {msg && <div className={`p-3 rounded-lg text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{msg.text}</div>}

        {/* Status Pipeline */}
        <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Status Pipeline</h3>
          <div className="flex gap-2 flex-wrap">
            {statusList.map(s => (
              <button key={s} onClick={() => updateStatus(s)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${data.status === s ? statusColors[s] : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {s === data.status ? '● ' : ''}{s}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-gray-500">Tipe:</span><br /><span className="font-medium capitalize">{data.content_type || '-'}</span></div>
            <div><span className="text-gray-500">Tanggal Post:</span><br /><span className="font-medium">{data.tanggal_post ? new Date(data.tanggal_post).toLocaleDateString('id-ID') : '-'}</span></div>
            <div><span className="text-gray-500">Kampanye:</span><br /><span className="font-medium">{data.kampanye_nama || '-'}</span></div>
            <div><span className="text-gray-500">Platform:</span><br /><span className="font-medium">{data.platforms?.map(p => p.platform).join(', ') || '-'}</span></div>
            <div><span className="text-gray-500">Engagement:</span><br /><span className="font-bold text-blue-600">{totalEngagement.toLocaleString()}</span></div>
          </div>
          {data.caption && <div className="mt-4"><span className="text-gray-500 text-sm">Caption:</span><p className="mt-1 text-sm whitespace-pre-wrap">{data.caption}</p></div>}
          {data.hashtags && <div className="mt-2"><span className="text-sm text-blue-500">{data.hashtags}</span></div>}
          {data.notes && <div className="mt-2 text-sm text-gray-500 italic">📝 {data.notes}</div>}
        </div>

        {/* Metrics */}
        <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">📊 Metrics ({data.metrics?.length || 0})</h3>
            <button onClick={() => setShowMetrics(!showMetrics)} className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">+ Tambah</button>
          </div>

          {showMetrics && (
            <form onSubmit={submitMetrics} className="mb-4 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><label className="text-xs">Platform</label><select value={metricsForm.platform} onChange={e => setMetricsForm({ ...metricsForm, platform: e.target.value })} className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] text-sm"><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="tiktok">TikTok</option></select></div>
                {['likes', 'comments', 'shares', 'reach', 'views', 'saves'].map(k => (
                  <div key={k}><label className="text-xs capitalize">{k}</label><input type="number" min="0" value={(metricsForm as any)[k]} onChange={e => setMetricsForm({ ...metricsForm, [k]: Number(e.target.value) })} className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] text-sm" /></div>
                ))}
              </div>
              <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg">Simpan</button>
            </form>
          )}

          {data.metrics?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500 border-b dark:border-gray-700">
                  <th className="py-2">Tanggal</th><th>Platform</th><th>Likes</th><th>Comments</th><th>Shares</th><th>Reach</th><th>Views</th><th>Saves</th>
                </tr></thead>
                <tbody>{data.metrics.map(m => (
                  <tr key={m.id} className="border-b dark:border-gray-700">
                    <td className="py-2">{m.tanggal_cek}</td><td>{m.platform}</td>
                    <td>{m.likes?.toLocaleString()}</td><td>{m.comments?.toLocaleString()}</td><td>{m.shares?.toLocaleString()}</td><td>{m.reach?.toLocaleString()}</td><td>{m.views?.toLocaleString()}</td><td>{m.saves?.toLocaleString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className="text-gray-500 text-sm text-center py-2">Belum ada metrics</p>}
        </div>
      </main>
    </div>
  )
}
