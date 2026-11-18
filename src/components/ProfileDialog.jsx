import { useEffect, useState } from 'react'
import { UserRound, X } from 'lucide-react'

export default function ProfileDialog({ open, initialProfile, onSave, onCancel }) {
  const [nama, setNama] = useState('')
  const [divisi, setDivisi] = useState('')
  const [jabatan, setJabatan] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setNama(initialProfile?.nama || '')
      setDivisi(initialProfile?.divisi || '')
      setJabatan(initialProfile?.jabatan || '')
      setError('')
    }
  }, [open, initialProfile])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nama.trim()) {
      setError('Nama wajib diisi')
      return
    }
    onSave({ nama: nama.trim(), divisi: divisi.trim(), jabatan: jabatan.trim() })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onCancel}
        className="animate-fade-in absolute inset-0 cursor-default bg-brand-950/40"
      />
      <form onSubmit={handleSubmit} className="animate-modal-in relative w-full max-w-md rounded-xl border border-brand-600/15 bg-white p-5 shadow-card" noValidate>
        <button type="button" onClick={onCancel} className="icon-btn absolute right-4 top-4 !h-8 !w-8" aria-label="Tutup dialog">
          <X size={15} />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indonesia text-gold-400">
          <UserRound size={20} aria-hidden="true" />
        </div>
        <h2 id="profile-title" className="mt-3 text-base font-bold text-brand-950">Profil Saya</h2>
        <p className="mt-0.5 text-[11px] text-brand-900/55">Nama, divisi, dan jabatan akan tampil di aplikasi & laporan export.</p>

        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="profil-nama" className="label">Nama Lengkap *</label>
            <input id="profil-nama" type="text" autoFocus className={`input ${error ? 'input-error' : ''}`} value={nama} onChange={(e) => { setNama(e.target.value); setError('') }} placeholder="Contoh: Budi Santoso" maxLength={80} />
            {error && <p className="mt-1 text-xs text-indonesia">{error}</p>}
          </div>
          <div>
            <label htmlFor="profil-divisi" className="label">Divisi</label>
            <input id="profil-divisi" type="text" className="input" value={divisi} onChange={(e) => setDivisi(e.target.value)} placeholder="Contoh: Operasional / Finance / IT" maxLength={80} />
          </div>
          <div>
            <label htmlFor="profil-jabatan" className="label">Jabatan</label>
            <input id="profil-jabatan" type="text" className="input" value={jabatan} onChange={(e) => setJabatan(e.target.value)} placeholder="Contoh: Staff, Supervisor, Manager" maxLength={80} />
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-ghost" onClick={onCancel}>Batal</button>
          <button type="submit" className="btn-primary">Simpan Profil</button>
        </div>
      </form>
    </div>
  )
}
