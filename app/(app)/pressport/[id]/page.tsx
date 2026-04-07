'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PressportDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  useEffect(() => {
    if (!token) { router.push('/'); return }
    fetch('/api/pressport/' + params.id, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json()).then(d => setData(d)).catch(() => {}).finally(() => setLoading(false))
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm('Hapus media ini?')) return
    await fetch('/api/pressport/' + params.id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
    router.push('/pressport')
  }

  if (loading) return <div className="flex items-center justify-center p-20"><div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" /></div>
  if (!data) return <div className="p-6 text-gray-500">Tidak ditemukan</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold truncate max-w-lg">{data.judul}</h2>
        <button onClick={handleDelete} className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition">Hapus</button>
      </div>
      <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Kategori:</span><br /><span className="font-medium">{data.kategori_nama || '-'}</span></div>
          <div><span className="text-gray-500">Tanggal:</span><br /><span className="font-medium">{data.tanggal ? new Date(data.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span></div>
          <div className="col-span-2"><span className="text-gray-500">Deskripsi:</span><br /><span className="font-medium whitespace-pre-wrap">{data.deskripsi || '-'}</span></div>
        </div>
      </div>
      <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-4">File ({data.files?.length || 0})</h3>
        {data.files?.length > 0 ? (
          <div className="space-y-2">{data.files.map((f: any) => (
            <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-xl">{f.file_type?.startsWith('image') ? '🖼️' : '📄'}</span>
              <div><p className="font-medium text-sm">{f.file_name}</p><p className="text-xs text-gray-500">{f.file_size ? (f.file_size / 1048576).toFixed(1) + ' MB' : '-'}</p></div>
            </div>
          ))}</div>
        ) : <p className="text-gray-500 text-sm text-center py-4">Belum ada file</p>}
      </div>
    </div>
  )
}
