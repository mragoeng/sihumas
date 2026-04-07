'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LaporanPage() {
  const [modul, setModul] = useState('arkiven')
  const [dari, setDari] = useState('')
  const [sampai, setSampai] = useState('')
  const [format, setFormat] = useState('json')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const generate = async () => {
    setLoading(true)
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }
    const params = new URLSearchParams({ format })
    if (dari) params.set('dari', dari)
    if (sampai) params.set('sampai', sampai)

    const res = await fetch(`/api/laporan/${modul}?${params}`, { headers: { Authorization: `Bearer ${token}` } })
    if (format === 'csv') {
      const text = await res.text()
      const blob = new Blob([text], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `laporan-${modul}-${new Date().toISOString().split('T')[0]}.csv`
      a.click(); URL.revokeObjectURL(url)
      setData(null)
    } else {
      const json = await res.json()
      setData(json)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1B1B1B]">
      <header className="bg-white dark:bg-[#2a2a2a] shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-500 hover:text-primary-600">←</Link>
          <h1 className="text-xl font-bold text-primary-800 dark:text-primary-400">📄 Laporan</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Form */}
        <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Modul</label>
              <select value={modul} onChange={e => setModul(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none">
                <option value="arkiven">📂 Arkiven</option>
                <option value="sociapulse">📱 Sociapulse</option>
                <option value="pressport">📰 Pressport</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dari Tanggal</label>
              <input type="date" value={dari} onChange={e => setDari(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sampai Tanggal</label>
              <input type="date" value={sampai} onChange={e => setSampai(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Format</label>
              <select value={format} onChange={e => setFormat(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none">
                <option value="json">📊 Lihat Online</option>
                <option value="csv">📥 Download CSV</option>
              </select>
            </div>
          </div>
          <button onClick={generate} disabled={loading} className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-lg transition">
            {loading ? 'Memproses...' : '📄 Generate Laporan'}
          </button>
        </div>

        {/* Results */}
        {data && (
          <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold mb-3">Hasil ({data.total || 0} data)</h3>
            {data.data?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left border-b dark:border-gray-700 text-gray-500">
                    <th className="py-2 pr-3">Judul</th>
                    <th className="py-2 pr-3">Kategori</th>
                    <th className="py-2 pr-3">Tanggal</th>
                  </tr></thead>
                  <tbody>{data.data.map((item: any) => (
                    <tr key={item.id} className="border-b dark:border-gray-700">
                      <td className="py-2 pr-3 font-medium">{item.judul}</td>
                      <td className="py-2 pr-3 text-gray-500">{item.kategori_nama || '-'}</td>
                      <td className="py-2 pr-3 text-gray-500">{item.tanggal}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <p className="text-gray-500 text-center py-4">Tidak ada data untuk periode ini</p>}
          </div>
        )}
      </main>
    </div>
  )
}
