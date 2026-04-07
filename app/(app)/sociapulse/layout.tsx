import ModulSidebar from '@/components/layout/ModulSidebar'

const menu = [
  { href: '/sociapulse', label: 'Dashboard', icon: '📊' },
  { href: '/sociapulse/tambah', label: 'Tambah Konten', icon: '➕' },
  { href: '/sociapulse/calendar', label: 'Content Calendar', icon: '📅' },
  { href: '/sociapulse/kampanye', label: 'Kampanye', icon: '🎯' },
  { href: '/sociapulse/assets', label: 'Assets Library', icon: '🖼️' },
  { href: '/sociapulse/kategori', label: 'Kategori', icon: '🏷️' },
  { href: '/sociapulse/laporan', label: 'Laporan', icon: '📄' },
]

export default function SociapulseLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModulSidebar icon="📱" title="Sociapulse" color="from-blue-600 to-purple-700" menu={menu}>
      {children}
    </ModulSidebar>
  )
}
