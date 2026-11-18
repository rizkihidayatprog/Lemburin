import { Stamp } from 'lucide-react'
import { formatRupiah } from '../utils/currencyUtils'
import { formatDecimalHours } from '../utils/dateUtils'
import { FEE } from '../lib/calculateFee'

// Panel rekap — lembur yang BELUM di-ACC (periode otomatis dari tanggal data)
export default function SummaryPanel({ summary, periodeLabel, periodeRange, pendingCount, onRequestAcc, accLoading }) {
  const maxFee = Math.max(...summary.byCategory.map((c) => c.fee), 1)

  return (
    <section id="rekap" className="card scroll-mt-20 p-4 sm:p-5" aria-label="Rekap fee">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-brand-950">Rekap Belum ACC</h2>
          <p className="text-[11px] text-brand-900/55">{pendingCount} data menunggu persetujuan atasan</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-brand-800/50">Periode (otomatis)</p>
          <p className="text-xs font-bold text-indonesia">{periodeLabel}</p>
          {periodeRange && <p className="mt-0.5 max-w-[180px] text-[9px] leading-snug text-brand-900/50">{periodeRange}</p>}
        </div>
      </div>

      {/* Kategori */}
      <div className="mt-4 space-y-2">
        {summary.byCategory.map((cat) => (
          <div key={cat.key} className="flex items-center gap-2 text-[11px]">
            <span className="w-32 shrink-0 font-medium text-brand-900/85 sm:w-36">
              {cat.label}
              <span className="ml-1 text-brand-800/45">({cat.count}×)</span>
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-100">
              <div
                className="h-full rounded-full bg-indonesia transition-all duration-500"
                style={{ width: `${(cat.fee / maxFee) * 100}%` }}
              />
            </div>
            <span className="w-20 shrink-0 text-right font-mono text-[10px] text-brand-800/70">{formatRupiah(cat.fee)}</span>
          </div>
        ))}
      </div>

      {/* Total + statistik */}
      <div className="mt-4 border-t border-brand-600/15 pt-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-800/70">Total Fee</span>
          <span className="font-mono text-xl font-bold text-indonesia">{formatRupiah(summary.totalFee)}</span>
        </div>
        <p className="mt-1 text-[11px] text-brand-900/55">
          {summary.totalRecords} data · {summary.totalDays} hari · {formatDecimalHours(summary.totalDurationMinutes)} jam
        </p>
      </div>

      {/* Tombol ACC */}
      <button
        type="button"
        className="btn-gold mt-4 w-full !py-3"
        onClick={onRequestAcc}
        disabled={pendingCount === 0 || accLoading}
        title="Setelah di-ACC: data terkunci & arsip dihapus otomatis setelah 3 bulan"
      >
        <Stamp size={17} aria-hidden="true" />
        {accLoading ? 'Meng-ACC…' : 'ACC Rekap Ini'}
      </button>
      <p className="mt-1.5 text-center text-[10px] text-brand-900/50">
        Setelah di-ACC atasan, data dikunci dan rekap baru dimulai dari nol.<br />Data arsip ACC otomatis dihapus setelah 3 bulan.
      </p>
    </section>
  )
}

// Kartu kecil berisi aturan fee
export function FeeRules() {
  const rows = [
    ['Pagi ≤ 06.00', formatRupiah(FEE.MORNING_MAX)],
    ['Pagi 06.01–07.00', formatRupiah(FEE.MORNING_LATE)],
    ['Malam', formatRupiah(FEE.NIGHT)],
    ['Pagi + Malam', '20/30rb + 35rb'],
    ['Overnight Weekday', formatRupiah(FEE.WEEKDAY_OVERNIGHT)],
    ['Weekend < 4 jam', formatRupiah(FEE.WEEKEND_HALFDAY)],
    ['Weekend ≥ 4 jam', formatRupiah(FEE.WEEKEND_FULLDAY)],
    ['Overnight Weekend', formatRupiah(FEE.WEEKEND_OVERNIGHT)],
  ]
  return (
    <section className="card p-4 sm:p-5" aria-label="Ketentuan fee">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-brand-800/50">Ketentuan Fee</h3>
      <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-[11px] sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <li key={label} className="flex items-center justify-between gap-2 border-b border-brand-600/10 py-1">
            <span className="text-brand-900/65">{label}</span>
            <span className="font-mono text-brand-950">{value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] leading-snug text-brand-900/50">
        Overnight menggantikan fee lain (tidak di-stack). Hari ditentukan dari tanggal mulai lembur (WIB).
      </p>
    </section>
  )
}
