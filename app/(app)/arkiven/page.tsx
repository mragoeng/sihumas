'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Arsip {
  id: number
  judul: string
  tanggal: string
  kategori_nama: string
  deskripsi: string
  files: any[]
}

export default function ArkivenPage() {
  const [data, setData] = useState<Arsip[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    fetch(`/api/arkiven?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(res => { setData(res.data || []); setTotal(res.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, search, router])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">List Arsip</h2>
          <p className="text-sm text-gray-500">{total} total arsip</p>
        </div>
        <Link href="/arkiven/tambah" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition">
          + Tambah Arsip
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="🔍 Cari arsip..."
          className="w-full md:w-96 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg animate-skeleton" />)}</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-2">📂</p>
          <p>Belum ada arsip</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#333]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Judul</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Files</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-[#333] transition">
                  <td className="px-4 py-3 font-medium">{item.judul}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.kategori_nama || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.files?.length || 0} file</td>
                  <td className="px-4 py-3"><Link href={`/arkiven/${item.id}`} className="text-primary-600 hover:text-primary-800 text-sm">Detail →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 text-sm">← Prev</button>
          <span className="px-3 py-1 text-sm text-gray-500">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 text-sm">Next →</button>
        </div>
      )}
    </div>
  )
}
