'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Media { id: number; judul: string; tanggal: string; kategori_nama: string; files: any[] }

export default function PressportPage() {
  const [data, setData] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }
    const params = new URLSearchParams({ page: '1', limit: '20' })
    if (search) params.set('search', search)
    fetch('/api/pressport?' + params, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(res => { setData(res.data || []); setTotal(res.total || 0) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [search, router])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-xl font-bold">List Media Cetak</h2><p className="text-sm text-gray-500">{total} total</p></div>
        <Link href="/pressport/tambah" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition">+ Tambah Media</Link>
      </div>
      <div className="mb-4">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari media..." className="w-full md:w-96 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none" />
      </div>
      {loading ? <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto" /> :
       data.length === 0 ? <div className="text-center py-12 text-gray-500"><p className="text-4xl mb-2">📰</p><p>Belum ada media cetak</p></div> :
       <div className="bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#333]"><tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Judul</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Files</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-[#333] transition">
                <td className="px-4 py-3 font-medium">{item.judul}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{item.kategori_nama || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{item.files?.length || 0}</td>
                <td className="px-4 py-3"><Link href={'/pressport/' + item.id} className="text-amber-600 text-sm">Detail →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
       </div>
      }
    </div>
  )
}
