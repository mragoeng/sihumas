import ModulSidebar from '@/components/layout/ModulSidebar'

const menu = [
  { href: '/arkiven', label: 'Dashboard', icon: '📊' },
  { href: '/arkiven/list', label: 'List Arsip', icon: '📋' },
  { href: '/arkiven/tambah', label: 'Tambah Arsip', icon: '➕' },
  { href: '/arkiven/kategori', label: 'Kategori', icon: '🏷️' },
  { href: '/arkiven/laporan', label: 'Laporan', icon: '📄' },
]

export default function ArkivenLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModulSidebar title="Arkiven" icon="🗂️" color="from-primary-700 to-primary-900" menu={menu}>
      {children}
    </ModulSidebar>
  )
}
