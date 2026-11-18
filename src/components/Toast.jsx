import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}
const STYLES = {
  success: 'border-emerald-600/40 text-emerald-800',
  error: 'border-brand-600/40 text-brand-800',
  info: 'border-gold-600/50 text-gold-700',
}

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(92vw,340px)] flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || Info
        return (
          <div
            key={toast.id}
            role="status"
            className={`animate-toast-in pointer-events-auto flex items-start gap-2.5 rounded-lg border bg-white px-3.5 py-2.5 text-xs font-medium shadow-sm ${STYLES[toast.type] || STYLES.info}`}
          >
            <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="flex-1 leading-snug text-brand-950">{toast.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 rounded p-0.5 text-brand-800/50 transition hover:text-brand-950"
              aria-label="Tutup notifikasi"
            >
              <X size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
