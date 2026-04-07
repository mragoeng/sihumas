'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Kampanye { id: number; nama: string; deskripsi: string; status: string; tanggal_mulai: string; tanggal_selesai: string }

export default function TambahSociapulsePage() {
  const [judul, setJudul] = useState('')
  const [contentType, setContentType] = useState('post')
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [tanggalPost, setTanggalPost] = useState('')
  const [notes, setNotes] = useState('')
  const [kampanyeId, setKampanyeId] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [kampanyes, setKampanyes] = useState<Kampanye[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }
    fetch('/api/sociapulse/kampanye', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setKampanyes(d.data || [])).catch(() => {})
  }, [router])

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setMsg(null)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/sociapulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ judul, content_type: contentType, caption, hashtags, tanggal_post: tanggalPost || null, notes, kampanye_id: kampanyeId || null, platforms })
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ type: 'err', text: data.error }); return }
      setMsg({ type: 'ok', text: `Konten berhasil dibuat (ID: ${data.id})` })
      setTimeout(() => router.push('/sociapulse'), 1500)
    } catch { setMsg({ type: 'err', text: 'Terjadi kesalahan' }) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1B1B1B]">
      <header className="bg-white dark:bg-[#2a2a2a] shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/sociapulse" className="text-gray-500 hover:text-blue-600">←</Link>
          <h1 className="text-xl font-bold text-blue-600">Tambah Konten</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        {msg && <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{msg.text}</div>}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#2a2a2a] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
          <div><label className="block text-sm font-medium mb-1">Judul *</label><input type="text" value={judul} onChange={e => setJudul(e.target.value)} required className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium mb-1">Tipe Konten</label>
            <select value={contentType} onChange={e => setContentType(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none">
              <option value="post">📝 Post</option><option value="story">⭕ Story</option><option value="reel">🎬 Reel</option>
              <option value="video">🎥 Video</option><option value="carousel">🎠 Carousel</option><option value="thread">🧵 Thread</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">Platform</label>
            <div className="flex gap-3">
              {[{ k: 'instagram', l: '📸 Instagram' }, { k: 'facebook', l: '👤 Facebook' }, { k: 'tiktok', l: '🎵 TikTok' }].map(p => (
                <label key={p.k} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition ${platforms.includes(p.k) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}>
                  <input type="checkbox" checked={platforms.includes(p.k)} onChange={() => togglePlatform(p.k)} className="hidden" />{p.l}
                </label>
              ))}
            </div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Kampanye</label>
            <select value={kampanyeId} onChange={e => setKampanyeId(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none">
              <option value="">-- Tanpa Kampanye --</option>{kampanyes.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">Tanggal Post</label><input type="date" value={tanggalPost} onChange={e => setTanggalPost(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Caption</label><textarea value={caption} onChange={e => setCaption(e.target.value)} rows={3} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Hashtags</label><input type="text" value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#example #hashtag" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none" /></div>
          <div><label className="block text-sm font-medium mb-1">Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none" /></div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition">{loading ? 'Menyimpan...' : 'Simpan Konten'}</button>
        </form>
      </main>
    </div>
  )
}
