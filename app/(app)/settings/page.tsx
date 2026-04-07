'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }
    fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setSettings(d)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setMsg(null)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings)
      })
      const d = await res.json()
      if (res.ok) setMsg({ type: 'ok', text: 'Settings disimpan!' })
      else setMsg({ type: 'err', text: d.error })
    } catch { setMsg({ type: 'err', text: 'Gagal menyimpan' }) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>

  const fields = [
    { group: '👤 Data Humas', items: [
      { key: 'humas_nama', label: 'Nama Humas' },
      { key: 'humas_jabatan', label: 'Jabatan' },
      { key: 'humas_nip', label: 'NIP' },
    ]},
    { group: '👔 Data Pimpinan', items: [
      { key: 'pimpinan_nama', label: 'Nama Pimpinan' },
      { key: 'pimpinan_jabatan', label: 'Jabatan' },
      { key: 'pimpinan_nip', label: 'NIP' },
    ]},
    { group: '🎨 Branding', items: [
      { key: 'logo_url', label: 'Logo URL' },
    ]},
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1B1B1B]">
      <header className="bg-white dark:bg-[#2a2a2a] shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-500 hover:text-primary-600">←</Link>
          <h1 className="text-xl font-bold text-primary-800 dark:text-primary-400">⚙️ Settings</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {msg && <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{msg.text}</div>}
        <form onSubmit={handleSave} className="space-y-6">
          {fields.map(group => (
            <div key={group.group} className="bg-white dark:bg-[#2a2a2a] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-4">{group.group}</h3>
              <div className="space-y-3">
                {group.items.map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium mb-1">{f.label}</label>
                    <input type="text" value={settings[f.key] || ''} onChange={e => setSettings({ ...settings, [f.key]: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button type="submit" disabled={saving} className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-lg transition">{saving ? 'Menyimpan...' : 'Simpan Settings'}</button>
        </form>
      </main>
    </div>
  )
}
