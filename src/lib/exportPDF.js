// Export laporan lembur ke .pdf (jsPDF + autoTable), A4 landscape
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatIndonesianDate, formatTimeDots, periodeFromRecords, getExportTimestamp } from '../utils/dateUtils'
import { OVERTIME_TYPE_LABELS } from './calculateFee'
import { TYPE_INFO } from './overtimeTypeInfo'
import { formatRupiah } from '../utils/currencyUtils'

/** Bangun dokumen PDF tanpa mengunduh — dipakai oleh modal pratinjau */
export function generateOvertimePDF(records, summary, profile) {
  const periode = periodeFromRecords(records)
  const fileName = `Laporan_Lembur_${periode.slug}.pdf`

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Tanpa judul/branding — file langsung mulai dari periode & profil
  // Garis aksen kuning tipis di paling atas
  const PAGE_W = 297 // A4 landscape
  doc.setFillColor(250, 204, 21)
  doc.rect(0, 0, PAGE_W, 2.2, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(107, 26, 21)
  doc.text(`Periode: ${periode.rangeLabel}`, 14, 14)
  doc.text(`Dicetak: ${getExportTimestamp()} WIB`, 14, 20)

  // Baris profil — selalu tampil (placeholder bila belum diisi)
  const profParts = profile?.nama || profile?.divisi || profile?.jabatan
    ? [
        `Nama: ${profile?.nama || '-'}`,
        `Divisi: ${profile?.divisi || '-'}`,
        `Jabatan: ${profile?.jabatan || '-'}`,
      ]
    : ['Nama: -   |   Divisi: -   |   Jabatan: -']

  doc.setFillColor(254, 243, 199)
  doc.roundedRect(14, 24, 269, 8, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(74, 14, 10)
  doc.text(profParts.join('   |   '), 18, 29.4)

  const accentY = 36

  // Tabel detail
  autoTable(doc, {
    startY: accentY + 6,
    head: [['HARI/TANGGAL', 'WAKTU', 'KETERANGAN', 'Jenis Lembur', 'FEE']],
    body: records.map((r) => [
      formatIndonesianDate(r.date),
      `${formatTimeDots(r.startTime)}–${formatTimeDots(r.endTime)}`,
      r.description || '-',
      OVERTIME_TYPE_LABELS[r.overtimeType] || r.overtimeType || '-',
      formatRupiah(r.fee),
    ]),
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [74, 14, 10] },
    headStyles: { fillColor: [206, 17, 38], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [253, 240, 239] },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 32 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 52 },
      4: { cellWidth: 32, halign: 'right' },
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

  // Keterangan jenis lembur
  y = doc.lastAutoTable.finalY + 8
  if (y > 140) {
    doc.addPage()
    y = 18
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(74, 14, 10)
  doc.text('KETERANGAN JENIS LEMBUR', 14, y)
  y += 2
  autoTable(doc, {
    startY: y,
    head: [['Jenis', 'Keterangan']],
    body: TYPE_INFO.map((t) => [t.label, t.desc]),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [206, 17, 38], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 42, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
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
    doc.text(String(periode.label), 14, 200)
    doc.text(`Halaman ${page} dari ${totalPages}`, 283, 200, { align: 'right' })
  }

  return { blob: doc.output('blob'), fileName, periodeLabel: periode.label }
}

/** Unduh langsung tanpa pratinjau (fallback) */
export function exportOvertimePDF(records, summary, profile) {
  const { blob, fileName } = generateOvertimePDF(records, summary, profile)
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
