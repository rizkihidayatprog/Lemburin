import { useEffect } from 'react'
import { AlertTriangle, X, Stamp } from 'lucide-react'

export default function ConfirmDialog({
  open,
  title,
  message,
  detail,
  confirmLabel = 'Hapus',
  onConfirm,
  onCancel,
  loading = false,
  tone = 'danger', // 'danger' (hapus) | 'gold' (ACC rekap)
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) onCancel?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel, loading])

  if (!open) return null

  const isGold = tone === 'gold'
  const Icon = isGold ? Stamp : AlertTriangle

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <button
        type="button"
        aria-label="Tutup"
        onClick={() => !loading && onCancel?.()}
        className="animate-fade-in absolute inset-0 cursor-default bg-brand-950/55 backdrop-blur-sm"
      />
      <div className="animate-modal-in relative w-full max-w-md rounded-2xl border border-brand-600/15 bg-white p-6 shadow-card">
        <button
          type="button"
          onClick={() => !loading && onCancel?.()}
          className="icon-btn absolute right-4 top-4 !h-8 !w-8"
          aria-label="Tutup dialog"
        >
          <X size={16} />
        </button>

        <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${isGold ? 'border-gold-500/60 bg-gold-400/20 text-gold-600' : 'border-brand-600/25 bg-brand-50 text-brand-600'}`}>
          <Icon size={22} aria-hidden="true" />
        </div>
        <h2 id="confirm-title" className="mt-4 text-lg font-extrabold text-brand-950">{title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-brand-900/75">{message}</p>
        {detail && (
          <div className="mt-3 rounded-xl border border-brand-600/15 bg-brand-50 px-4 py-2.5 text-xs font-medium leading-relaxed text-brand-800">
            {detail}
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-ghost" onClick={() => onCancel?.()} disabled={loading}>
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm?.()}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition disabled:opacity-60 ${
              isGold
                ? 'border border-gold-600/50 bg-gold-400 text-brand-950 hover:bg-gold-300'
                : 'bg-indonesia text-white hover:bg-brand-800'
            }`}
          >
            {loading ? (isGold ? 'Meng-ACC…' : 'Menghapus…') : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
