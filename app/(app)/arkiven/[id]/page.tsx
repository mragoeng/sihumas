'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Arsip {
  id: number
  judul: string
  tanggal: string
  deskripsi: string
  kategori_id: number
  kategori_nama: string
  files: { id: number; file_name: string; file_size: number; upload_status: string }[]
  created_at: string
}

export default function ArkivenDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<Arsip | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ judul: '', kategori_id: '', tanggal: '', deskripsi: '' })
  const [categories, setCategories] = useState<{ id: number; nama: string }[]>([])
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const router = useRouter()

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!token) { router.push('/'); return }
    fetch(`/api/arkiven/${params.id}`, { headers })
      .then(r => r.json())
      .then(d => {
        setData(d)
        setForm({ judul: d.judul, kategori_id: d.kategori_id || '', tanggal: d.tanggal, deskripsi: d.deskripsi || '' })
      })
      .catch(() => setMsg({ type: 'err', text: 'Gagal memuat data' }))
      .finally(() => setLoading(false))

    fetch(`/api/categories?modul=arkiven`, { headers })
      .then(r => r.json())
      .then(d => setCategories(d.data || []))
      .catch(() => {})
  }, [params.id])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    try {
      const res = await fetch(`/api/arkiven/${params.id}`, {
        method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const d = await res.json()
      if (!res.ok) { setMsg({ type: 'err', text: d.error }); return }
      setMsg({ type: 'ok', text: 'Berhasil diupdate!' })
      setEditing(false)
      setData(prev => prev ? { ...prev, ...form, kategori_id: Number(form.kategori_id), kategori_nama: categories.find(c => c.id === Number(form.kategori_id))?.nama || '' } as Arsip : prev)
    } catch { setMsg({ type: 'err', text: 'Gagal update' }) }
  }

  const handleDelete = async () => {
    if (!confirm('Hapus arsip ini?')) return
    try {
      await fetch(`/api/arkiven/${params.id}`, { method: 'DELETE', headers })
      router.push('/arkiven')
    } catch { setMsg({ type: 'err', text: 'Gagal hapus' }) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>

  if (!data) return <div className="min-h-screen flex items-center justify-center text-gray-500">Arsip tidak ditemukan</div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1B1B1B]">
      <header className="bg-white dark:bg-[#2a2a2a] shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/arkiven" className="text-gray-500 hover:text-primary-600">← Kembali</Link>
            <h1 className="text-lg font-bold text-primary-800 dark:text-primary-400 truncate max-w-md">📂 {data.judul}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(!editing)} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] transition">
              {editing ? 'Batal' : '✏️ Edit'}
            </button>
            <button onClick={handleDelete} className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition">🗑️ Hapus</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {msg && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{msg.text}</div>
        )}

        {editing ? (
          <form onSubmit={handleUpdate} className="bg-white dark:bg-[#2a2a2a] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Judul *</label>
              <input type="text" value={form.judul} onChange={e => setForm({ ...form, judul: e.target.value })} required className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kategori</label>
              <select value={form.kategori_id} onChange={e => setForm({ ...form, kategori_id: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none">
                <option value="">-- Tanpa Kategori --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tanggal *</label>
              <input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} required className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Deskripsi</label>
              <textarea value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} rows={4} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none" />
            </div>
            <button type="submit" className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition">Simpan Perubahan</button>
          </form>
        ) : (
          <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Kategori:</span><br /><span className="font-medium">{data.kategori_nama || '-'}</span></div>
              <div><span className="text-gray-500">Tanggal:</span><br /><span className="font-medium">{new Date(data.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
              <div className="col-span-2"><span className="text-gray-500">Deskripsi:</span><br /><span className="font-medium whitespace-pre-wrap">{data.deskripsi || '-'}</span></div>
            </div>
          </div>
        )}

        {/* Files Section */}
        <div className="mt-6 bg-white dark:bg-[#2a2a2a] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-4">📎 File ({data.files?.length || 0})</h3>
          {data.files && data.files.length > 0 ? (
            <div className="space-y-2">
              {data.files.map((f: any) => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{f.file_type?.startsWith('image') ? '🖼️' : f.file_type?.startsWith('video') ? '🎬' : '📄'}</span>
                    <div>
                      <p className="font-medium text-sm">{f.file_name}</p>
                      <p className="text-xs text-gray-500">{f.file_size ? `${(f.file_size / 1024 / 1024).toFixed(1)} MB` : '-'} • <span className={f.upload_status === 'done' ? 'text-green-500' : 'text-yellow-500'}>{f.upload_status}</span></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">Belum ada file</p>
          )}
        </div>
      </main>
    </div>
  )
}
