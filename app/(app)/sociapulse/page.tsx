'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Konten { id: number; judul: string; content_type: string; status: string; tanggal_post: string; kampanye_nama: string; platforms: { platform: string }[] }

const statusColors: Record<string, string> = {
  ide: 'bg-gray-100 text-gray-600', draft: 'bg-yellow-100 text-yellow-700',
  review: 'bg-orange-100 text-orange-700', approved: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-purple-100 text-purple-700', published: 'bg-green-100 text-green-700',
}
const typeIcons: Record<string, string> = { post: '📝', story: '⭕', reel: '🎬', video: '🎥', carousel: '🎠', thread: '🧵' }

export default function SociapulsePage() {
  const [data, setData] = useState<Konten[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }
    const params = new URLSearchParams({ page: '1', limit: '20' })
    if (search) params.set('search', search)
    if (filterStatus) params.set('status', filterStatus)
    fetch('/api/sociapulse?' + params, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(res => { setData(res.data || []) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [search, filterStatus, router])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-xl font-bold">Content List</h2></div>
        <Link href="/sociapulse/tambah" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">+ Tambah Konten</Link>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari konten..." className="flex-1 min-w-48 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none">
          <option value="">Semua Status</option>
          <option value="ide">Ide</option><option value="draft">Draft</option><option value="review">Review</option>
          <option value="approved">Approved</option><option value="scheduled">Scheduled</option><option value="published">Published</option>
        </select>
      </div>
      {loading ? <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" /> :
       data.length === 0 ? <div className="text-center py-12 text-gray-500"><p className="text-4xl mb-2">📱</p><p>Belum ada konten</p></div> :
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(item => (
          <Link key={item.id} href={'/sociapulse/' + item.id} className="block">
            <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{typeIcons[item.content_type] || '📝'}</span>
                <span className={"text-xs px-2 py-1 rounded-full font-medium " + (statusColors[item.status] || '')}>{item.status}</span>
              </div>
              <h3 className="font-semibold text-sm mb-1 line-clamp-2">{item.judul}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                {item.platforms?.map((p, i) => <span key={i}>{p.platform === 'instagram' ? '📸' : p.platform === 'facebook' ? '👤' : '🎵'}</span>)}
                {item.tanggal_post && <span>{new Date(item.tanggal_post).toLocaleDateString('id-ID')}</span>}
              </div>
              {item.kampanye_nama && <p className="text-xs text-blue-500 mt-1">🎯 {item.kampanye_nama}</p>}
            </div>
          </Link>
        ))}
       </div>
      }
    </div>
  )
}
