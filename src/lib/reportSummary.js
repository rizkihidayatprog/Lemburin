// Rekap terpusat — dipakai Dashboard, Export Excel, dan Export PDF
import { calculateMorningFee, FEE } from './calculateFee'

const CATEGORY_DEFS = [
  { key: 'pagi',              label: 'Pagi',                 types: ['pagi'] },
  { key: 'malam',             label: 'Malam',                types: ['malam'] },
  { key: 'pagi_malam',        label: 'Pagi + Malam',         types: ['pagi_malam'] },
  { key: 'overnight',         label: 'Overnight (Weekday)',  types: ['overnight'] },
  { key: 'weekend',           label: 'Weekend',              types: ['weekend_halfday', 'weekend_fullday'] },
  { key: 'weekend_overnight', label: 'Weekend Overnight',    types: ['weekend_overnight'] },
]

export function computeSummary(records) {
  const rows = records || []
  const feeOf = (r) => Number(r.fee) || 0
  const minutesOf = (r) => Number(r.durationMinutes) || 0

  const totalRecords = rows.length
  const totalDays = new Set(rows.map((r) => r.date)).size
  const totalDurationMinutes = rows.reduce((s, r) => s + minutesOf(r), 0)
  const totalFee = rows.reduce((s, r) => s + feeOf(r), 0)

  const isMorning = (t) => t === 'pagi' || t === 'pagi_malam'
  const isNight = (t) => t === 'malam' || t === 'pagi_malam'
  const isOvernight = (t) => t === 'overnight' || t === 'weekend_overnight'
  const isWeekendRegular = (t) => t === 'weekend_halfday' || t === 'weekend_fullday'

  // Fee pagi = porsi pagi (berdasarkan jam mulai), fee malam = 35rb per record malam
  const feePagi = rows.reduce((s, r) => s + (isMorning(r.overtimeType) ? calculateMorningFee(r.startTime) : 0), 0)
  const feeMalam = rows.filter((r) => isNight(r.overtimeType)).length * FEE.NIGHT
  const feeOvernight = rows.filter((r) => isOvernight(r.overtimeType)).reduce((s, r) => s + feeOf(r), 0)
  const overnightCount = rows.filter((r) => isOvernight(r.overtimeType)).length
  const feeWeekend = rows.filter((r) => isWeekendRegular(r.overtimeType)).reduce((s, r) => s + feeOf(r), 0)

  const byCategory = CATEGORY_DEFS.map((def) => {
    const matched = rows.filter((r) => def.types.includes(r.overtimeType))
    return {
      key: def.key,
      label: def.label,
      count: matched.length,
      fee: matched.reduce((s, r) => s + feeOf(r), 0),
    }
  })

  return {
    totalRecords,
    totalDays,
    totalDurationMinutes,
    totalFee,
    feePagi,
    feeMalam,
    feeOvernight,
    overnightCount,
    feeWeekend,
    byCategory,
  }
}
