'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Category { id: number; nama: string }

export default function TambahPressportPage() {
  const [judul, setJudul] = useState('')
  const [kategoriId, setKategoriId] = useState('')
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])
  const [deskripsi, setDeskripsi] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }
    fetch(`/api/categories?modul=pressport`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(res => setCategories(res.data || [])).catch(() => {})
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setMsg(null)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/pressport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ judul, kategori_id: kategoriId || null, tanggal, deskripsi })
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ type: 'err', text: data.error }); return }
      setMsg({ type: 'ok', text: `Media berhasil dibuat (ID: ${data.id})` })
      setTimeout(() => router.push('/pressport'), 1500)
    } catch { setMsg({ type: 'err', text: 'Terjadi kesalahan' }) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1B1B1B]">
      <header className="bg-white dark:bg-[#2a2a2a] shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/pressport" className="text-gray-500 hover:text-gold-600">←</Link>
          <h1 className="text-xl font-bold text-gold-600">Tambah Media Cetak</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        {msg && <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{msg.text}</div>}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#2a2a2a] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
          <div><label className="block text-sm font-medium mb-1">Judul *</label><input type="text" value={judul} onChange={e => setJudul(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none focus:ring-2 focus:ring-gold-500" /></div>
          <div><label className="block text-sm font-medium mb-1">Kategori</label><select value={kategoriId} onChange={e => setKategoriId(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none"><option value="">-- Pilih --</option>{categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">Tanggal *</label><input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Deskripsi</label><textarea value={deskripsi} onChange={e => setDeskripsi(e.target.value)} rows={3} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none" /></div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-gold-600 hover:bg-gold-700 disabled:bg-gold-400 text-white font-semibold rounded-lg transition">{loading ? 'Menyimpan...' : 'Simpan Media'}</button>
        </form>
      </main>
    </div>
  )
}
