'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/arkiven', label: 'Arkiven', icon: '📂' },
  { href: '/sociapulse', label: 'Sociapulse', icon: '📱' },
  { href: '/pressport', label: 'Pressport', icon: '📰' },
  { href: '/laporan', label: 'Laporan', icon: '📄' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
  { href: '/logs', label: 'Activity Log', icon: '📋' },
]

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true'
    }
    return false
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-primary-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏛️</span>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-white text-lg leading-tight">Humas BPKH</h1>
              <p className="text-primary-300 text-xs">Sistem Informasi</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              isActive(item.href)
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-primary-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-primary-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-primary-300 hover:bg-red-500/20 hover:text-red-300 transition w-full"
        >
          <span>🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(prev => {
            const next = !prev
            localStorage.setItem('sidebar-collapsed', String(next))
            return next
          })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-primary-400 hover:bg-white/10 transition w-full mt-1"
        >
          <span>{collapsed ? '→' : '←'}</span>
          {!collapsed && <span>Collapase</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#1B1B1B]">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-gradient-to-b from-primary-700 to-primary-900 text-white transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-primary-700 to-primary-900 text-white">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white dark:bg-[#2a2a2a] shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="text-gray-600 dark:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-primary-800 dark:text-primary-400">🏛️ Humas BPKH</span>
          <div className="w-6" />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
