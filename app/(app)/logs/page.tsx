'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Log { id: number; user_id: number; modul: string; action: string; description: string; ip_address: string; created_at: string }

const modulColors: Record<string, string> = {
  arkiven: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  sociapulse: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pressport: 'bg-gold-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  settings: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  auth: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function LogsPage() {
  const [data, setData] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [filterModul, setFilterModul] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }
    const params = new URLSearchParams({ limit: '100' })
    if (filterModul) params.set('modul', filterModul)
    fetch(`/api/logs?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setData(d.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [filterModul])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1B1B1B]">
      <header className="bg-white dark:bg-[#2a2a2a] shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-500 hover:text-primary-600">←</Link>
          <h1 className="text-xl font-bold text-primary-800 dark:text-primary-400">📋 Activity Logs</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-4">
          <select value={filterModul} onChange={e => setFilterModul(e.target.value)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#333] outline-none">
            <option value="">Semua Modul</option>
            <option value="auth">🔐 Auth</option>
            <option value="arkiven">📂 Arkiven</option>
            <option value="sociapulse">📱 Sociapulse</option>
            <option value="pressport">📰 Pressport</option>
            <option value="settings">⚙️ Settings</option>
          </select>
        </div>

        {loading ? <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" /> : data.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><p className="text-4xl mb-2">📋</p><p>Belum ada activity</p></div>
        ) : (
          <div className="space-y-2">
            {data.map(log => (
              <div key={log.id} className="bg-white dark:bg-[#2a2a2a] rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${modulColors[log.modul] || 'bg-gray-100'}`}>{log.modul}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{log.action}{log.description ? ` — ${log.description}` : ''}</p>
                  <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString('id-ID')}{log.ip_address ? ` • IP: ${log.ip_address}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
