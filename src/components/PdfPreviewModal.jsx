import { useEffect } from 'react'
import { X, FileDown, FileText } from 'lucide-react'

// Modal pratinjau PDF — user melihat isi PDF dulu, baru mengunduh
export default function PdfPreviewModal({ open, url, fileName, subtitle, onClose, onDownload }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Pratinjau PDF">
      <button
        type="button"
        aria-label="Tutup pratinjau"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 cursor-default bg-brand-950/60"
      />
      <div className="animate-modal-in relative flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-brand-600/20 bg-white shadow-card">
        {/* Header modal */}
        <div className="flex items-center gap-3 border-b border-brand-600/15 bg-brand-50 px-4 py-2.5 sm:px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indonesia text-gold-400">
            <FileText size={17} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-brand-950">Pratinjau Laporan PDF</p>
            <p className="truncate text-[11px] text-brand-800/60">{subtitle || fileName}</p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn" aria-label="Tutup pratinjau">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Isi PDF */}
        <div className="min-h-0 flex-1 bg-brand-100/40">
          <iframe
            src={url}
            title={fileName || 'pratinjau-pdf'}
            className="h-full w-full border-0"
          />
        </div>

        {/* Footer modal */}
        <div className="flex flex-col-reverse gap-2 border-t border-brand-600/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="truncate text-[11px] text-brand-800/55">{fileName}</p>
          <div className="flex items-center justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Batal</button>
            <button type="button" className="btn-primary" onClick={onDownload}>
              <FileDown size={16} aria-hidden="true" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
