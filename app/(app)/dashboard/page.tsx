'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Stat {
  label: string
  value: number
  icon: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/'); return }
    // Fetch dashboard stats
    fetch('/api/arkiven?limit=1', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(() => {
        setStats([
          { label: 'Arkiven', value: 0, icon: '📂' },
          { label: 'Sociapulse', value: 0, icon: '📱' },
          { label: 'Pressport', value: 0, icon: '📰' },
        ])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  const modules = [
    { name: 'Arkiven', desc: 'Arsip Dokumentasi', icon: '📂', href: '/arkiven', color: 'from-green-500 to-green-700', emoji: '🗂️' },
    { name: 'Sociapulse', desc: 'Social Media Hub', icon: '📱', href: '/sociapulse', color: 'from-blue-500 to-purple-600', emoji: '📱' },
    { name: 'Pressport', desc: 'Media Cetak', icon: '📰', href: '/pressport', color: 'from-gold-500 to-orange-500', emoji: '📰' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1B1B1B]">
      {/* Header */}
      <header className="bg-white dark:bg-[#2a2a2a] shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏛️</span>
            <div>
              <h1 className="text-xl font-bold text-primary-800 dark:text-primary-400">Humas BPKH</h1>
              <p className="text-xs text-gray-500">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/settings" className="text-gray-500 hover:text-primary-600 transition">⚙️</Link>
            <Link href="/logs" className="text-gray-500 hover:text-primary-600 transition">📋</Link>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 transition">Logout</button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {modules.map((m) => (
            <Link key={m.name} href={m.href} className="group">
              <div className={`bg-gradient-to-br ${m.color} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                <div className="text-4xl mb-3">{m.emoji}</div>
                <h2 className="text-xl font-bold">{m.name}</h2>
                <p className="text-white/80 text-sm mt-1">{m.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-[#2a2a2a] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-4">Aksi Cepat</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/arkiven?tambah=1" className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition text-center text-sm">
              📂 Tambah Arsip
            </Link>
            <Link href="/sociapulse?tambah=1" className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition text-center text-sm">
              📱 Tambah Konten
            </Link>
            <Link href="/pressport?tambah=1" className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition text-center text-sm">
              📰 Tambah Media
            </Link>
            <Link href="/laporan" className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition text-center text-sm">
              📄 Laporan
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
