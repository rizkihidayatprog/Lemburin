import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  BULAN_ID,
  parseDateLocal,
  formatIndonesianDate,
  formatIndonesianDateLong,
} from '../utils/dateUtils'

const WEEKDAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function toISO(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Date picker custom — format & Bahasa Indonesia, tema merah–putih–kuning.
 * value & onChange memakai string 'YYYY-MM-DD'.
 */
export default function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Pilih tanggal…',
  compact = false,
  invalid = false,
  ariaLabel = 'Pilih tanggal',
}) {
  const selected = useMemo(() => parseDateLocal(value), [value])
  const now = new Date()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => ({
    y: selected?.getFullYear() ?? now.getFullYear(),
    m: selected?.getMonth() ?? now.getMonth(),
  }))
  const rootRef = useRef(null)

  // Sinkronkan bulan yang ditampilkan saat value berubah dari luar
  useEffect(() => {
    if (selected) setView({ y: selected.getFullYear(), m: selected.getMonth() })
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tutup saat klik di luar / tekan Escape
  useEffect(() => {
    if (!open) return undefined
    const onMouseDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // ── Bangun grid 6 minggu ─────────────────────────────────────────────
  const cells = useMemo(() => {
    const firstWeekday = new Date(view.y, view.m, 1).getDay()
    const daysThisMonth = new Date(view.y, view.m + 1, 0).getDate()
    const daysPrevMonth = new Date(view.y, view.m, 0).getDate()
    const list = []
    for (let i = 0; i < 42; i += 1) {
      const dayNum = i - firstWeekday + 1
      let date
      let otherMonth = false
      if (dayNum < 1) {
        date = new Date(view.y, view.m - 1, daysPrevMonth + dayNum)
        otherMonth = true
      } else if (dayNum > daysThisMonth) {
        date = new Date(view.y, view.m + 1, dayNum - daysThisMonth)
        otherMonth = true
      } else {
        date = new Date(view.y, view.m, dayNum)
      }
      list.push({ date, otherMonth, iso: toISO(date) })
    }
    return list
  }, [view])

  const todayIso = toISO(new Date())
  const selectedIso = value || ''

  const prevMonth = () => setView((v) => {
    const m = v.m - 1
    return m < 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m }
  })
  const nextMonth = () => setView((v) => {
    const m = v.m + 1
    return m > 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m }
  })

  const pick = (iso) => {
    onChange(iso)
    setOpen(false)
  }

  const triggerText = selected
    ? compact ? formatIndonesianDate(value) : formatIndonesianDateLong(value)
    : placeholder

  return (
    <div ref={rootRef} className="relative">
      {/* Tombol pemicu */}
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`input flex items-center gap-2.5 text-left ${compact ? '!py-1 !text-xs' : ''} ${invalid ? 'input-error' : ''} ${value ? '' : 'text-brand-800/40'}`}
      >
        <CalendarDays size={compact ? 14 : 17} className="shrink-0 text-indonesia" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate font-medium">{triggerText}</span>
        <ChevronDown size={compact ? 13 : 15} className={`shrink-0 text-brand-800/50 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {/* Popover kalender */}
      {open && (
        <div
          role="dialog"
          aria-label="Pilih tanggal"
          className="animate-modal-in absolute left-0 z-50 mt-1.5 w-[284px] rounded-xl border border-brand-600/20 bg-white p-3 shadow-card"
        >
          {/* Header bulan & tahun */}
          <div className="flex items-center justify-between gap-1">
            <button type="button" onClick={prevMonth} className="icon-btn !h-8 !w-8" aria-label="Bulan sebelumnya">
              <ChevronLeft size={15} aria-hidden="true" />
            </button>
            <p className="text-sm font-bold text-brand-950">
              {BULAN_ID[view.m]} {view.y}
            </p>
            <button type="button" onClick={nextMonth} className="icon-btn !h-8 !w-8" aria-label="Bulan berikutnya">
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>

          {/* Nama hari */}
          <div className="mt-2 grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_LABELS.map((d, i) => (
              <span
                key={d}
                className={`py-1 text-[10px] font-bold uppercase tracking-wide ${i === 0 || i === 6 ? 'text-indonesia' : 'text-brand-800/55'}`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Grid tanggal */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const isSelected = cell.iso === selectedIso
              const isToday = cell.iso === todayIso
              const dayOfWeek = cell.date.getDay()
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => pick(cell.iso)}
                  aria-label={formatIndonesianDateLong(cell.iso)}
                  aria-pressed={isSelected}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition
                    ${isSelected
                      ? 'bg-indonesia font-bold text-white'
                      : cell.otherMonth
                        ? 'text-brand-800/25 hover:bg-brand-50'
                        : isWeekend
                          ? 'text-indonesia hover:bg-brand-50'
                          : 'text-brand-950 hover:bg-brand-50'}
                    ${isToday && !isSelected ? 'font-bold text-gold-700 ring-1 ring-inset ring-gold-500' : ''}`}
                >
                  {cell.date.getDate()}
                </button>
              )
            })}
          </div>

          {/* Footer: hari ini & hapus */}
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-brand-600/10 pt-2">
            <button
              type="button"
              onClick={() => pick(todayIso)}
              className="rounded-md px-2 py-1 text-[11px] font-semibold text-indonesia transition hover:bg-brand-50"
            >
              Hari Ini
            </button>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false) }}
                className="rounded-md px-2 py-1 text-[11px] font-medium text-brand-800/60 transition hover:bg-brand-50"
              >
                Hapus
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
