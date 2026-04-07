'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Category { id: number; nama: string }

export default function TambahArsipPage() {
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
    fetch('/api/categories?modul=arkiven', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(res => setCategories(res.data || [])).catch(() => {})
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setMsg(null)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/arkiven', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ judul, kategori_id: kategoriId || null, tanggal, deskripsi })
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ type: 'err', text: data.error }); return }
      setMsg({ type: 'ok', text: 'Arsip berhasil dibuat!' })
      setTimeout(() => router.push('/arkiven'), 1500)
    } catch { setMsg({ type: 'err', text: 'Terjadi kesalahan' }) }
    finally { setLoading(false) }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">Tambah Arsip</h2>
      {msg && <div className={"mb-4 p-3 rounded-lg text-sm " + (msg.type === 'ok' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>{msg.text}</div>}
      <form onSubmit={handleSubmit} className="max-w-2xl bg-white dark:bg-[#2a2a2a] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
        <div><label className="block text-sm font-medium mb-1">Judul *</label><input type="text" value={judul} onChange={e => setJudul(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none" /></div>
        <div><label className="block text-sm font-medium mb-1">Kategori</label><select value={kategoriId} onChange={e => setKategoriId(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none"><option value="">-- Pilih Kategori --</option>{categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}</select></div>
        <div><label className="block text-sm font-medium mb-1">Tanggal *</label><input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none" /></div>
        <div><label className="block text-sm font-medium mb-1">Deskripsi</label><textarea value={deskripsi} onChange={e => setDeskripsi(e.target.value)} rows={3} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none" /></div>
        <button type="submit" disabled={loading} className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-lg transition">{loading ? 'Menyimpan...' : 'Simpan Arsip'}</button>
      </form>
    </div>
  )
}
