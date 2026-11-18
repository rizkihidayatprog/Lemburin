// Utilitas tanggal & waktu — semua perhitungan hari memakai kalender lokal (WIB, Asia/Jakarta)

/** Urutkan record: tanggal terlama → terbaru (tie-break jam mulai) */
export function sortByDateAsc(records) {
  return [...(records || [])].sort((a, b) => {
    const cmp = String(a?.date || '').localeCompare(String(b?.date || ''))
    if (cmp !== 0) return cmp
    return String(a?.startTime || '').localeCompare(String(b?.startTime || ''))
  })
}

/** Slug periode untuk nama FILE: bulan & tahun tanggal terbaru, mis. 'November_2026' */
export function filePeriodSlug(records) {
  const dates = (records || []).map((r) => r?.date).filter(Boolean).sort()
  if (!dates.length) return 'Semua_Periode'
  const d = parseDateLocal(dates[dates.length - 1])
  return `${BULAN_ID[d.getMonth()]}_${d.getFullYear()}`
}

export const HARI_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export const BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export const BULAN_ID_SINGKAT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

/** Parse 'YYYY-MM-DD' sebagai tanggal lokal (bukan UTC) supaya hari tidak bergeser */
export function parseDateLocal(dateStr) {
  if (!dateStr) return null
  const [year, month, day] = String(dateStr).split('-').map(Number)
  if (!year || !month || !day) return null
  const d = new Date(year, month - 1, day)
  if (Number.isNaN(d.getTime())) return null
  return d
}

/** weekday = Senin–Jumat, weekend = Sabtu–Minggu (Asia/Jakarta / kalender lokal) */
export function getDayType(dateStr) {
  const d = parseDateLocal(dateStr)
  if (!d) return 'weekday'
  const day = d.getDay()
  return day === 0 || day === 6 ? 'weekend' : 'weekday'
}

export function getDayNameId(dateStr) {
  const d = parseDateLocal(dateStr)
  return d ? HARI_ID[d.getDay()] : ''
}

/** 'Senin, 2 Nov 2026' */
export function formatIndonesianDate(dateStr) {
  const d = parseDateLocal(dateStr)
  if (!d) return '-'
  return `${HARI_ID[d.getDay()]}, ${d.getDate()} ${BULAN_ID_SINGKAT[d.getMonth()]} ${d.getFullYear()}`
}

/** 'Senin, 2 November 2026' */
export function formatIndonesianDateLong(dateStr) {
  const d = parseDateLocal(dateStr)
  if (!d) return '-'
  return `${HARI_ID[d.getDay()]}, ${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`
}

/** 'HH:mm' -> 'HH.mm' (format tabel Indonesia) */
export function formatTimeDots(time) {
  return String(time || '').replace(':', '.')
}

/** Tambahkan menit ke 'HH:mm', kembalikan { endTime: 'HH:mm', nextDay: boolean } */
export function addMinutesToTime(startTime, minutes) {
  const [h, m] = String(startTime || '00:00').split(':').map(Number)
  const start = (h || 0) * 60 + (m || 0)
  const total = start + (Number(minutes) || 0)
  const end = ((total % 1440) + 1440) % 1440
  const eh = String(Math.floor(end / 60)).padStart(2, '0')
  const em = String(end % 60).padStart(2, '0')
  return { endTime: `${eh}:${em}`, nextDay: total >= 1440 }
}

/** 120 -> '2 jam', 150 -> '2 jam 30 menit' */
export function formatDuration(minutes) {
  const total = Number(minutes) || 0
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} menit`
  if (m === 0) return `${h} jam`
  return `${h} jam ${m} menit`
}

/** 150 -> '2,5' (jam desimal, koma Indonesia) */
export function formatDecimalHours(minutes) {
  const hours = (Number(minutes) || 0) / 60
  return hours.toLocaleString('id-ID', { maximumFractionDigits: 2 })
}

export function getNowWib() {
  return new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'full',
    timeStyle: 'short',
  })
}

export function getExportTimestamp() {
  return new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Periode OTOMATIS dari rentang tanggal data.
 * Contoh: data 10 Oktober s.d. 10 November → label "Oktober s.d. November 2026"
 */
export function periodeFromRecords(records) {
  const dates = (records || []).map((r) => r?.date).filter(Boolean).sort()
  if (!dates.length) {
    return { label: 'Belum Ada Data', rangeLabel: '—', slug: 'Belum_Ada_Data', min: null, max: null, count: 0 }
  }
  const min = dates[0]
  const max = dates[dates.length - 1]
  const dMin = parseDateLocal(min)
  const dMax = parseDateLocal(max)

  const sameDay = min === max
  const sameMonth = min.slice(0, 7) === max.slice(0, 7)
  const sameYear = min.slice(0, 4) === max.slice(0, 4)

  let label
  if (sameDay) {
    label = `${dMin.getDate()} ${BULAN_ID[dMin.getMonth()]} ${dMin.getFullYear()}`
  } else if (sameMonth) {
    label = `${BULAN_ID[dMin.getMonth()]} ${dMin.getFullYear()}`
  } else if (sameYear) {
    label = `${BULAN_ID[dMin.getMonth()]} s.d. ${BULAN_ID[dMax.getMonth()]} ${dMax.getFullYear()}`
  } else {
    label = `${BULAN_ID[dMin.getMonth()]} ${dMin.getFullYear()} s.d. ${BULAN_ID[dMax.getMonth()]} ${dMax.getFullYear()}`
  }

  const rangeLabel = sameDay
    ? formatIndonesianDateLong(min)
    : `${formatIndonesianDateLong(min)} s.d. ${formatIndonesianDateLong(max)}`

  const slug = label
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')

  return { label, rangeLabel, slug, min, max, count: dates.length }
}
