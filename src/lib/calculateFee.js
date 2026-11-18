// ============================================================
// Perhitungan Fee Lembur — Overtime Management
// Acuan: PRD Overtime Management v1.0, bagian 5 & 9
// Zona waktu: Asia/Jakarta (WIB)
// ============================================================

export const FEE = {
  MORNING_MAX: 30000,      // Jam masuk <= 06.00
  MORNING_LATE: 20000,     // Jam masuk > 06.00 sampai 07.00
  NIGHT: 35000,            // Lembur malam
  WEEKDAY_OVERNIGHT: 50000, // Menginap weekday (menggantikan fee lain)
  WEEKEND_HALFDAY: 40000,   // Weekend < 4 jam
  WEEKEND_FULLDAY: 80000,   // Weekend >= 4 jam
  WEEKEND_OVERNIGHT: 100000, // Menginap weekend (menggantikan fee lain)
}

export const WEEKEND_FULLDAY_THRESHOLD_MINUTES = 240 // tepat 4 jam = Rp80.000

export const OVERTIME_TYPES = [
  { value: 'pagi',              label: 'Pagi',                group: 'Weekday (Senin–Jumat)' },
  { value: 'malam',             label: 'Malam',               group: 'Weekday (Senin–Jumat)' },
  { value: 'pagi_malam',        label: 'Pagi + Malam',        group: 'Weekday (Senin–Jumat)' },
  { value: 'overnight',         label: 'Overnight (Menginap)', group: 'Weekday (Senin–Jumat)' },
  { value: 'weekend_halfday',   label: 'Weekend Halfday (< 4 jam)', group: 'Weekend (Sabtu–Minggu)' },
  { value: 'weekend_fullday',   label: 'Weekend Fullday (min. 4 jam)', group: 'Weekend (Sabtu–Minggu)' },
  { value: 'weekend_overnight', label: 'Weekend Overnight (Menginap)', group: 'Weekend (Sabtu–Minggu)' },
]

export const OVERTIME_TYPE_LABELS = Object.fromEntries(
  OVERTIME_TYPES.map((t) => [t.value, t.label]),
)

/** Tipe yang dikategorikan sebagai overnight */
export const OVERNIGHT_TYPES = ['overnight', 'weekend_overnight']

export function isOvernightType(type) {
  return OVERNIGHT_TYPES.includes(type)
}

/** Fee pagi weekday berdasarkan jam mulai: <=06.00 → 30rb, <=07.00 → 20rb, selebihnya 0 */
export function calculateMorningFee(startTime) {
  if (!startTime) return 0
  const t = String(startTime).slice(0, 5)
  if (t <= '06:00') return FEE.MORNING_MAX
  if (t <= '07:00') return FEE.MORNING_LATE
  return 0
}

/**
 * Hitung fee lembur.
 * @param {{ dayType: 'weekday'|'weekend', overtimeType: string, startTime?: string, durationMinutes?: number }} input
 * @returns {number} fee dalam rupiah
 */
export function calculateFee({ dayType, overtimeType, startTime, durationMinutes }) {
  const minutes = Number(durationMinutes) || 0
  const isWeekend = dayType === 'weekend'

  // Prioritas 1 — Overnight menggantikan semua fee lain (tidak di-stack)
  if (overtimeType === 'overnight' || overtimeType === 'weekend_overnight') {
    return isWeekend || overtimeType === 'weekend_overnight'
      ? FEE.WEEKEND_OVERNIGHT
      : FEE.WEEKDAY_OVERNIGHT
  }

  // Prioritas 2 — Weekend biasa: < 4 jam → 40rb, ≥ 4 jam → 80rb
  if (isWeekend || overtimeType === 'weekend_halfday' || overtimeType === 'weekend_fullday') {
    return minutes < WEEKEND_FULLDAY_THRESHOLD_MINUTES ? FEE.WEEKEND_HALFDAY : FEE.WEEKEND_FULLDAY
  }

  // Prioritas 3 — Weekday biasa: pagi (30rb/20rb/0) + malam (35rb), boleh digabung
  let fee = 0
  if (overtimeType === 'pagi' || overtimeType === 'pagi_malam') {
    fee += calculateMorningFee(startTime)
  }
  if (overtimeType === 'malam' || overtimeType === 'pagi_malam') {
    fee += FEE.NIGHT
  }
  return fee
}

/** Saran otomatis jenis lembur berdasarkan tipe hari & durasi (dipakai form sebagai default) */
export function suggestOvertimeType(dayType, durationMinutes = 0) {
  if (dayType === 'weekend') {
    return Number(durationMinutes) < WEEKEND_FULLDAY_THRESHOLD_MINUTES ? 'weekend_halfday' : 'weekend_fullday'
  }
  return 'pagi'
}
