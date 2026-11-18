import { Banknote, Clock, CalendarDays, MoonStar } from 'lucide-react'
import { formatRupiah } from '../utils/currencyUtils'
import { formatDecimalHours, formatDuration } from '../utils/dateUtils'

export default function DashboardCards({ summary, periode }) {
  const cards = [
    { label: 'Total Fee', value: formatRupiah(summary.totalFee), sub: `${summary.totalRecords} data · ${periode}`, icon: Banknote },
    { label: 'Total Jam', value: `${formatDecimalHours(summary.totalDurationMinutes)} jam`, sub: formatDuration(summary.totalDurationMinutes), icon: Clock },
    { label: 'Hari Lembur', value: String(summary.totalDays), sub: 'Tanggal unik', icon: CalendarDays },
    { label: 'Overnight', value: String(summary.overnightCount), sub: `Fee ${formatRupiah(summary.feeOvernight)}`, icon: MoonStar },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {cards.map(({ label, value, sub, icon: Icon }) => (
        <div key={label} className="stat-card">
          <div className="flex items-center gap-2">
            <Icon size={15} className="text-indonesia" aria-hidden="true" />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-800/70 sm:text-[11px]">{label}</p>
          </div>
          <p className="mt-2 font-mono text-base font-semibold leading-tight text-brand-950 sm:text-xl">{value}</p>
          <p className="mt-1 truncate text-[10px] text-brand-900/55 sm:text-[11px]">{sub}</p>
        </div>
      ))}
    </div>
  )
}
