// Export laporan lembur ke .xlsx yang rapi (ExcelJS)
import ExcelJS from 'exceljs'
import { formatIndonesianDate, formatTimeDots, periodeFromRecords, getExportTimestamp } from '../utils/dateUtils'
import { OVERTIME_TYPE_LABELS } from './calculateFee'

// ── Palet merah–putih–kuning ───────────────────────────────────────────
const RED = 'CE1126'
const RED_DARK = 'A01A12'
const BRAND_950 = '4A0E0A'
const CREAM_ROW = 'FDF6EC'
const GOLD = 'FACC15'
const GOLD_SOFT = 'FEF3C7'
const WARM_BORDER = 'E7D8CC'
const MUTED = '8C3A32'

function waKu(record) {
  return `${formatTimeDots(record.startTime)}–${formatTimeDots(record.endTime)}`
}

function thinBorder(color = WARM_BORDER) {
  const side = { style: 'thin', color: { argb: `FF${color}` } }
  return { top: side, bottom: side, left: side, right: side }
}

function profileLine(profile) {
  if (!profile) return 'Nama: -   |   Divisi: -   |   Jabatan: -'
  const parts = [
    `Nama: ${profile.nama || '-'}`,
    `Divisi: ${profile.divisi || '-'}`,
    `Jabatan: ${profile.jabatan || '-'}`,
  ]
  return parts.join('   |   ')
}

export async function exportOvertimeExcel(records, summary, profile) {
  const periode = periodeFromRecords(records)
  const fileName = `Laporan_Lembur_${periode.slug}.xlsx`

  const wb = new ExcelJS.Workbook()
  wb.creator = profile?.nama || 'Lemburin'
  wb.created = new Date()

  const ws = wb.addWorksheet('Rekap', {
    views: [{ showGridLines: false, state: 'frozen', ySplit: 5 }],
  })

  ws.columns = [
    { key: 'tanggal', width: 27 },
    { key: 'waktu', width: 17 },
    { key: 'keterangan', width: 46 },
    { key: 'jenis', width: 30 },
    { key: 'fee', width: 20 },
  ]

  // Tanpa judul/branding — file langsung mulai dari periode & profil
  ws.mergeCells('A1:E1')
  const per = ws.getCell('A1')
  per.value = `Periode: ${periode.rangeLabel}`
  per.font = { size: 13, bold: true, color: { argb: `FF${BRAND_950}` } }
  per.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(1).height = 24

  ws.mergeCells('A2:E2')
  const dicetak = ws.getCell('A2')
  dicetak.value = `Dicetak: ${getExportTimestamp()} WIB   |   Zona waktu: Asia/Jakarta (WIB)`
  dicetak.font = { size: 9, italic: true, color: { argb: `FF${MUTED}` } }
  dicetak.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(2).height = 18

  ws.mergeCells('A3:E3')
  const prof = ws.getCell('A3')
  prof.value = profileLine(profile)
  prof.font = { size: 10, bold: true, color: { argb: `FF${BRAND_950}` } }
  prof.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${GOLD_SOFT}` } }
  prof.alignment = { vertical: 'middle', horizontal: 'center' }
  prof.border = thinBorder(GOLD)
  ws.getRow(3).height = 22

  // Garis aksen kuning
  ws.mergeCells('A4:E4')
  const accent = ws.getCell('A4')
  accent.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${GOLD}` } }
  ws.getRow(4).height = 5

  // ── Header tabel ─────────────────────────────────────────────────────
  const headerRow = ws.getRow(5)
  headerRow.values = ['HARI/TANGGAL', 'WAKTU', 'KETERANGAN', 'Jenis Lembur', 'FEE']
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${RED_DARK}` } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = thinBorder(RED_DARK)
  })
  headerRow.height = 24

  // ── Data ─────────────────────────────────────────────────────────────
  records.forEach((r, i) => {
    const rowIndex = 6 + i
    const row = ws.getRow(rowIndex)
    row.values = [
      formatIndonesianDate(r.date),
      waKu(r),
      r.description || '-',
      OVERTIME_TYPE_LABELS[r.overtimeType] || r.overtimeType || '-',
      Number(r.fee) || 0,
    ]
    const isZebra = i % 2 === 1
    row.eachCell((cell) => {
      cell.border = thinBorder()
      cell.font = { size: 10, color: { argb: `FF${BRAND_950}` } }
      if (isZebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${CREAM_ROW}` } }
    })
    row.getCell(1).font = { size: 10, bold: true, color: { argb: `FF${BRAND_950}` } }
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(4).alignment = { vertical: 'middle' }
    row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' }
    row.getCell(5).numFmt = '"Rp"#,##0'
    row.getCell(5).font = { size: 10, bold: true, color: { argb: 'FFCE1126' } }
    row.height = 21
  })

  const dataEnd = 5 + records.length
  ws.autoFilter = `A5:E${Math.max(dataEnd, 5)}`

  // ── Total ────────────────────────────────────────────────────────────
  let cursor = dataEnd + 2 // 1 baris kosong

  const totalFeeRow = ws.getRow(cursor)
  ws.mergeCells(`C${cursor}:D${cursor}`)
  totalFeeRow.getCell(3).value = 'TOTAL FEE'
  totalFeeRow.getCell(3).font = { size: 12, bold: true, color: { argb: `FF${BRAND_950}` } }
  totalFeeRow.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' }
  // Fee total di kolom E (kolom FEE)
  totalFeeRow.getCell(5).value = summary.totalFee
  totalFeeRow.getCell(5).numFmt = '"Rp"#,##0'
  totalFeeRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' }
  totalFeeRow.getCell(5).font = { size: 12, bold: true, color: { argb: `FF${BRAND_950}` } }
  totalFeeRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${GOLD_SOFT}` } }
  totalFeeRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${GOLD_SOFT}` } }
  totalFeeRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${GOLD_SOFT}` } }
  totalFeeRow.getCell(3).border = { top: { style: 'double', color: { argb: `FF${RED_DARK}` } }, bottom: thinBorder(GOLD).bottom, left: thinBorder(GOLD).left, right: thinBorder(GOLD).right }
  totalFeeRow.getCell(4).border = { top: { style: 'double', color: { argb: `FF${RED_DARK}` } }, bottom: thinBorder(GOLD).bottom, left: thinBorder(GOLD).left, right: thinBorder(GOLD).right }
  totalFeeRow.getCell(5).border = { top: { style: 'double', color: { argb: `FF${RED_DARK}` } }, bottom: thinBorder(GOLD).bottom, left: thinBorder(GOLD).left, right: thinBorder(GOLD).right }
  totalFeeRow.height = 26

  const totals = [
    ['TOTAL DURASI', `${Math.floor(summary.totalDurationMinutes / 60)} jam ${summary.totalDurationMinutes % 60} menit`],
    ['TOTAL DATA', summary.totalRecords],
    ['TOTAL HARI', summary.totalDays],
  ]
  totals.forEach(([label, value], i) => {
    const row = ws.getRow(cursor + 1 + i)
    ws.mergeCells(`C${cursor + 1 + i}:D${cursor + 1 + i}`)
    row.getCell(3).value = label
    row.getCell(5).value = value
    row.getCell(3).font = { size: 10, bold: true, color: { argb: `FF${MUTED}` } }
    row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' }
    row.getCell(5).font = { size: 10, bold: true, color: { argb: `FF${BRAND_950}` } }
    row.height = 19
  })

  // ── Rekap per kategori ───────────────────────────────────────────────
  cursor = cursor + totals.length + 2 // 1 baris kosong
  ws.mergeCells(`A${cursor}:E${cursor}`)
  const rekapTitle = ws.getCell(`A${cursor}`)
  rekapTitle.value = 'REKAP FEE PER KATEGORI'
  rekapTitle.font = { size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
  rekapTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${RED}` } }
  rekapTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(cursor).height = 24

  const rekapHeader = ws.getRow(cursor + 1)
  rekapHeader.values = ['Kategori', 'Jumlah Record', 'Total Fee']
  rekapHeader.eachCell((cell) => {
    cell.font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${RED_DARK}` } }
    cell.border = thinBorder(RED_DARK)
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })
  rekapHeader.height = 20

  summary.byCategory.forEach((cat, i) => {
    const rowIndex = cursor + 2 + i
    const row = ws.getRow(rowIndex)
    row.values = [cat.label, cat.count, cat.fee]
    row.getCell(1).border = thinBorder()
    row.getCell(2).border = thinBorder()
    row.getCell(3).border = thinBorder()
    row.getCell(1).font = { size: 10, color: { argb: `FF${BRAND_950}` } }
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(2).font = { size: 10, color: { argb: `FF${BRAND_950}` } }
    row.getCell(3).numFmt = '"Rp"#,##0'
    row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' }
    row.getCell(3).font = { size: 10, bold: true, color: { argb: 'FFCE1126' } }
    if (i % 2 === 1) {
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${CREAM_ROW}` } }
      row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${CREAM_ROW}` } }
      row.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${CREAM_ROW}` } }
    }
    row.height = 19
  })

  // ── Print setup: A4 Landscape ────────────────────────────────────────
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: 'landscape',
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.35, bottom: 0.35, header: 0.15, footer: 0.15 },
  }
  ws.pageSetup.horizontalCentered = true
  ws.headerFooter = {
    oddHeader: '',
    oddFooter: `&L&8${periode.label}&C&8Dicetak: &D&R&8Halaman &P dari &N`,
  }

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return fileName
}
