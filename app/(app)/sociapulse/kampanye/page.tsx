'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Kampanye { id: number; nama: string; deskripsi: string; status: string; tanggal_mulai: string; tanggal_selesai: string }

export default function KampanyePage() {
  const [data, setData] = useState<Kampanye[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nama: '', deskripsi: '', tanggal_mulai: '', tanggal_selesai: '' })
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const router = useRouter()

  const loadData = () => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }
    fetch('/api/sociapulse/kampanye', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setData(d.data || [])).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    const res = await fetch('/api/sociapulse/kampanye', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    })
    const d = await res.json()
    if (res.ok) { setMsg({ type: 'ok', text: 'Kampanye dibuat!' }); setShowForm(false); setForm({ nama: '', deskripsi: '', tanggal_mulai: '', tanggal_selesai: '' }); loadData() }
    else setMsg({ type: 'err', text: d.error })
  }

  const statusColors: Record<string, string> = { planning: 'bg-yellow-100 text-yellow-700', active: 'bg-green-100 text-green-700', selesai: 'bg-gray-100 text-gray-600' }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1B1B1B]">
      <header className="bg-white dark:bg-[#2a2a2a] shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/sociapulse" className="text-gray-500 hover:text-blue-600">←</Link>
            <h1 className="text-xl font-bold text-blue-600">🎯 Kampanye</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">{showForm ? 'Batal' : '+ Kampanye Baru'}</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {msg && <div className={`p-3 rounded-lg text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{msg.text}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-[#2a2a2a] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-3">
            <div><label className="block text-sm font-medium mb-1">Nama *</label><input type="text" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none" /></div>
            <div><label className="block text-sm font-medium mb-1">Deskripsi</label><textarea value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} rows={2} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium mb-1">Mulai</label><input type="date" value={form.tanggal_mulai} onChange={e => setForm({ ...form, tanggal_mulai: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none" /></div>
              <div><label className="block text-sm font-medium mb-1">Selesai</label><input type="date" value={form.tanggal_selesai} onChange={e => setForm({ ...form, tanggal_selesai: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none" /></div>
            </div>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg">Buat Kampanye</button>
          </form>
        )}

        {loading ? <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" /> : data.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><p className="text-4xl mb-2">🎯</p><p>Belum ada kampanye</p></div>
        ) : (
          <div className="space-y-3">{data.map(k => (
            <div key={k.id} className="bg-white dark:bg-[#2a2a2a] rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{k.nama}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[k.status] || 'bg-gray-100'}`}>{k.status}</span>
              </div>
              {k.deskripsi && <p className="text-sm text-gray-500 mb-2">{k.deskripsi}</p>}
              <p className="text-xs text-gray-400">{k.tanggal_mulai ? `${k.tanggal_mulai} → ${k.tanggal_selesai || '...'}` : 'Tanggal belum ditentukan'}</p>
            </div>
          ))}</div>
        )}
      </main>
    </div>
  )
}
