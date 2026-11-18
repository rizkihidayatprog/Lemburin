import { Clock3, X, LayoutDashboard, PenSquare, Table2, FileBarChart2, Archive, Database, HardDrive, Pencil, UserRound } from 'lucide-react'
import { getInitials } from '../services/profileService'

const NAV = [
  { href: '#ringkasan', label: 'Ringkasan', icon: LayoutDashboard },
  { href: '#input-lembur', label: 'Input Lembur', icon: PenSquare },
  { href: '#data-lembur', label: 'Data Lembur', icon: Table2 },
  { href: '#rekap', label: 'Rekap & ACC', icon: FileBarChart2 },
  { href: '#riwayat', label: 'Riwayat ACC', icon: Archive },
]

export default function Sidebar({ open, onClose, usingFirebase, profile, onEditProfile }) {
  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={onClose}
          className="animate-fade-in fixed inset-0 z-40 bg-brand-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] transform flex-col border-r border-brand-600/15 bg-white transition-transform duration-200
                    lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-hidden={!open}
      >
        {/* Logo */}
        <div className="flex items-center justify-between gap-3 border-b border-brand-600/15 px-5 py-4">
          <a href="#ringkasan" onClick={onClose} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indonesia">
              <Clock3 size={18} strokeWidth={2.3} className="text-gold-400" aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold text-brand-950">Overtime <span className="text-indonesia">Management</span></span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-brand-800/60">Rekap Fee Lembur</span>
            </span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn lg:hidden"
            aria-label="Tutup menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigasi */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-brand-800/50">Menu</p>
          <div className="mt-1.5 space-y-0.5">
            {NAV.map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} onClick={onClose} className="nav-link">
                <Icon size={17} className="text-indonesia" aria-hidden="true" />
                {label}
              </a>
            ))}
          </div>

          {/* Mode database */}
          <div className="mt-5 rounded-lg border border-brand-600/15 bg-brand-50 px-3 py-2.5">
            <div className="flex items-center gap-2">
              {usingFirebase ? (
                <Database size={14} className="text-indonesia" aria-hidden="true" />
              ) : (
                <HardDrive size={14} className="text-gold-600" aria-hidden="true" />
              )}
              <p className="text-xs font-semibold text-brand-950">{usingFirebase ? 'Firebase Firestore' : 'Mode Lokal'}</p>
              <span className={`ml-auto h-1.5 w-1.5 rounded-full ${usingFirebase ? 'bg-emerald-500' : 'bg-gold-500'}`} />
            </div>
            <p className="mt-1 text-[11px] leading-snug text-brand-900/60">
              {usingFirebase
                ? 'Data realtime tersinkron otomatis.'
                : 'Data tersimpan di browser ini (belum terhubung Firebase).'}
            </p>
          </div>
        </nav>

        {/* Footer: profil pengguna */}
        <div className="border-t border-brand-600/15 px-4 py-3">
          {profile?.nama ? (
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indonesia text-[11px] font-bold text-gold-400">
                {getInitials(profile.nama)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold leading-tight text-brand-950">{profile.nama}</p>
                <p className="truncate text-[10px] leading-tight text-brand-800/60">
                  {[profile.jabatan, profile.divisi].filter(Boolean).join(' · ') || 'Lengkapi jabatan & divisi'}
                </p>
              </div>
              <button type="button" onClick={onEditProfile} className="icon-btn !h-8 !w-8" aria-label="Ubah profil" title="Ubah profil">
                <Pencil size={13} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={onEditProfile} className="btn-ghost w-full !py-2 text-xs">
              <UserRound size={14} aria-hidden="true" />
              Isi Nama, Divisi & Jabatan
            </button>
          )}
          <p className="mt-2 text-[9px] font-medium text-brand-800/45">Zona waktu Asia/Jakarta · Bahasa Indonesia</p>
        </div>
      </aside>
    </>
  )
}
