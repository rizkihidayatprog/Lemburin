// Export laporan lembur ke .pdf (jsPDF + autoTable), A4 landscape
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatIndonesianDate, formatTimeDots, periodeFromRecords, getExportTimestamp } from '../utils/dateUtils'
import { OVERTIME_TYPE_LABELS } from './calculateFee'
import { formatRupiah } from '../utils/currencyUtils'

export function exportOvertimePDF(records, summary, profile) {
  const periode = periodeFromRecords(records)
  const fileName = `Laporan_Lembur_${periode.slug}.pdf`

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(74, 14, 10)
  doc.text('LAPORAN LEMBUR', 14, 18)

  // Garis aksen (posisi menyesuaikan ada/tidaknya baris profil)
  let accentY = 34

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(107, 26, 21)
  doc.text(`Periode: ${periode.rangeLabel}`, 14, 25)
  doc.text(`Dicetak: ${getExportTimestamp()} WIB  |  Zona waktu: Asia/Jakarta (WIB)`, 14, 30)

  const profParts = []
  if (profile?.nama) profParts.push(`Nama: ${profile.nama}`)
  if (profile?.divisi) profParts.push(`Divisi: ${profile.divisi}`)
  if (profile?.jabatan) profParts.push(`Jabatan: ${profile.jabatan}`)
  if (profParts.length) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(74, 14, 10)
    doc.text(profParts.join('   |   '), 14, accentY)
    accentY = 40
  }

  doc.setDrawColor(250, 204, 21)
  doc.setLineWidth(1.2)
  doc.line(14, accentY, 283, accentY)

  // Tabel detail
  autoTable(doc, {
    startY: accentY + 6,
    head: [['HARI/TANGGAL', 'WAKTU', 'KETERANGAN', 'FEE', 'Jenis Lembur']],
    body: records.map((r) => [
      formatIndonesianDate(r.date),
      `${formatTimeDots(r.startTime)}–${formatTimeDots(r.endTime)}`,
      r.description || '-',
      formatRupiah(r.fee),
      OVERTIME_TYPE_LABELS[r.overtimeType] || r.overtimeType || '-',
    ]),
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [74, 14, 10] },
    headStyles: { fillColor: [206, 17, 38], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [253, 240, 239] },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 32 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 52 },
    },
    theme: 'grid',
    margin: { left: 14, right: 14 },
  })

  let y = doc.lastAutoTable.finalY + 8

  // Ringkasan
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(74, 14, 10)
  doc.text('RINGKASAN', 14, y)
  y += 2
  autoTable(doc, {
    startY: y,
    body: [
      ['Total data', String(summary.totalRecords), 'Total durasi', `${Math.floor(summary.totalDurationMinutes / 60)} jam ${summary.totalDurationMinutes % 60} menit`],
      ['Total hari', String(summary.totalDays), 'Total fee', formatRupiah(summary.totalFee)],
    ],
    theme: 'plain',
    styles: { fontSize: 9.5, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 34 },
      1: { cellWidth: 40 },
      2: { fontStyle: 'bold', cellWidth: 34 },
      3: {},
    },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 8

  // Rekap kategori
  if (y > 170) {
    doc.addPage()
    y = 18
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('REKAP FEE PER KATEGORI', 14, y)
  y += 2
  autoTable(doc, {
    startY: y,
    head: [['Kategori', 'Jumlah Record', 'Total Fee']],
    body: summary.byCategory.map((c) => [c.label, String(c.count), formatRupiah(c.fee)]),
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [206, 17, 38], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 2: { halign: 'right' } },
    theme: 'grid',
    margin: { left: 14, right: 14 },
  })

  // Footer di setiap halaman
  const totalPages = doc.getNumberOfPages()
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(140, 58, 50)
    doc.text(`Laporan Lembur — ${periode.label}`, 14, 200)
    doc.text(`Halaman ${page} dari ${totalPages}`, 283, 200, { align: 'right' })
  }

  doc.save(fileName)
  return fileName
}
