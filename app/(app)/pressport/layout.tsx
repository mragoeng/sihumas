import ModulSidebar from '@/components/layout/ModulSidebar'

const menu = [
  { href: '/pressport', label: 'List Media', icon: '📋' },
  { href: '/pressport/tambah', label: 'Tambah Media', icon: '➕' },
  { href: '/pressport/kategori', label: 'Kategori', icon: '🏷️' },
  { href: '/pressport/laporan', label: 'Laporan', icon: '📄' },
]

export default function PressportLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModulSidebar icon="📰" title="Pressport" color="from-amber-600 to-orange-700" menu={menu}>
      {children}
    </ModulSidebar>
  )
}
