// Export laporan lembur ke .xlsx (SheetJS)
import * as XLSX from 'xlsx'
import { formatIndonesianDate, formatTimeDots, periodeFromRecords, getExportTimestamp } from '../utils/dateUtils'
import { OVERTIME_TYPE_LABELS } from './calculateFee'

function waKu(record) {
  const start = formatTimeDots(record.startTime)
  const end = formatTimeDots(record.endTime)
  return `${start}–${end}`
}

function profileLine(profile) {
  if (!profile) return null
  const parts = []
  if (profile.nama) parts.push(`Nama: ${profile.nama}`)
  if (profile.divisi) parts.push(`Divisi: ${profile.divisi}`)
  if (profile.jabatan) parts.push(`Jabatan: ${profile.jabatan}`)
  return parts.length ? parts.join('   |   ') : null
}

export function exportOvertimeExcel(records, summary, profile) {
  const periode = periodeFromRecords(records)
  const fileName = `Laporan_Lembur_${periode.slug}.xlsx`

  // ── Susun baris dengan indeks dinamis ──────────────────────────────
  const titleRows = [
    ['LAPORAN LEMBUR'],
    [`Periode: ${periode.rangeLabel}`],
    [`Dicetak: ${getExportTimestamp()} WIB`],
  ]
  const profLine = profileLine(profile)
  if (profLine) titleRows.push([profLine])

  const headerIndex = titleRows.length + 1 // 1 baris kosong setelah judul
  const firstDataIndex = headerIndex + 1

  const wsData = [
    ...titleRows,
    [],
    ['HARI/TANGGAL', 'WAKTU', 'KETERANGAN', 'FEE', 'Jenis Lembur'],
    ...records.map((r) => [
      formatIndonesianDate(r.date),
      waKu(r),
      r.description || '-',
      Number(r.fee) || 0,
      OVERTIME_TYPE_LABELS[r.overtimeType] || r.overtimeType || '-',
    ]),
    [],
    ['', '', 'TOTAL FEE', summary.totalFee, ''],
    ['', '', 'TOTAL DURASI', `${Math.floor(summary.totalDurationMinutes / 60)} jam ${summary.totalDurationMinutes % 60} menit`, ''],
    ['', '', 'TOTAL DATA', summary.totalRecords, ''],
    ['', '', 'TOTAL HARI', summary.totalDays, ''],
    [],
    ['REKAP FEE PER KATEGORI'],
    ['Kategori', 'Jumlah Record', 'Total Fee'],
    ...summary.byCategory.map((c) => [c.label, c.count, c.fee]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Gabung sel judul (A..E)
  ws['!merges'] = titleRows.map((_, i) => XLSX.utils.decode_range(`A${i + 1}:E${i + 1}`))

  ws['!cols'] = [{ wch: 26 }, { wch: 18 }, { wch: 44 }, { wch: 18 }, { wch: 28 }]

  // Format rupiah untuk kolom FEE pada baris data
  for (let r = firstDataIndex; r < firstDataIndex + records.length; r += 1) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: 3 })]
    if (cell) cell.z = '"Rp"#,##0'
  }
  // Baris total fee
  const totalFeeIndex = firstDataIndex + records.length + 1
  const totalFeeCell = ws[XLSX.utils.encode_cell({ r: totalFeeIndex, c: 3 })]
  if (totalFeeCell) totalFeeCell.z = '"Rp"#,##0'
  // Rekap kategori: fee di kolom C
  const rekapHeaderIndex = totalFeeIndex + 6 // +4 total rows + 1 blank + 1 "REKAP" = index header kategori
  const rekapFirstIndex = rekapHeaderIndex + 1
  summary.byCategory.forEach((_, i) => {
    const cell = ws[XLSX.utils.encode_cell({ r: rekapFirstIndex + i, c: 2 })]
    if (cell) cell.z = '"Rp"#,##0'
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Lembur')
  XLSX.writeFile(wb, fileName)
  return fileName
}
