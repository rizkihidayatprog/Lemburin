import { useEffect, useMemo, useState } from 'react'
import { Pencil, Trash2, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Inbox, FileSpreadsheet, FileText, Loader2, Lock } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'
import { OVERTIME_TYPE_LABELS } from '../lib/calculateFee'
import { formatRupiah } from '../utils/currencyUtils'
import { formatIndonesianDate, formatTimeDots } from '../utils/dateUtils'

const PAGE_SIZE = 8

export default function OvertimeTable({
  records,
  onEdit,
  onDeleteRequest,
  onExportExcel,
  onExportPDF,
  exporting,
}) {
  const [sortDesc, setSortDesc] = useState(true)
  const [page, setPage] = useState(1)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [records.length])

  const sorted = useMemo(() => {
    return [...records].sort((a, b) => {
      const cmp = String(a.date).localeCompare(String(b.date)) || String(a.startTime).localeCompare(String(b.startTime))
      return sortDesc ? -cmp : cmp
    })
  }, [records, sortDesc])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const pageRows = sorted.slice(start, start + PAGE_SIZE)

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await onDeleteRequest(pendingDelete)
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const SortIcon = sortDesc ? ArrowDown : ArrowUp

  return (
    <div>
      {/* Header + tombol export (export = rekap aktif / data belum ACC) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-600/15 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-bold text-brand-950 sm:text-base">Riwayat Lembur</h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onExportExcel} disabled={exporting !== null || records.length === 0}
            className="btn-ghost !border-emerald-600/40 !px-3 !py-1.5 !text-xs !text-emerald-800 hover:!bg-emerald-50">
            {exporting === 'excel' ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <FileSpreadsheet size={14} aria-hidden="true" />}
            Excel
          </button>
          <button type="button" onClick={onExportPDF} disabled={exporting !== null || records.length === 0}
            className="btn-ghost !border-brand-600/40 !px-3 !py-1.5 !text-xs !text-indonesia hover:!bg-brand-50">
            {exporting === 'pdf' ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <FileText size={14} aria-hidden="true" />}
            PDF
          </button>
        </div>
      </div>

      {/* Tabel (scroll horizontal di mobile) */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-brand-600/15 bg-brand-50 text-[10px] uppercase tracking-wide text-brand-800/80">
              <th className="px-5 py-2.5 font-semibold">
                <button type="button" onClick={() => setSortDesc((v) => !v)} className="inline-flex items-center gap-1 hover:text-brand-950" aria-label="Urutkan tanggal">
                  Hari/Tanggal <SortIcon size={11} aria-hidden="true" />
                </button>
              </th>
              <th className="px-4 py-2.5 font-semibold">Waktu</th>
              <th className="px-4 py-2.5 font-semibold">Keterangan</th>
              <th className="px-4 py-2.5 font-semibold">Jenis</th>
              <th className="px-4 py-2.5 text-right font-semibold">Fee</th>
              <th className="px-4 py-2.5 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const isAcc = Boolean(row.acc)
              return (
                <tr key={row.id} className={`border-b border-brand-600/10 ${isAcc ? 'opacity-70' : ''}`}>
                  <td className="px-5 py-2.5 font-medium text-brand-950">{formatIndonesianDate(row.date)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-brand-900/80">
                    {formatTimeDots(row.startTime)}–{formatTimeDots(row.endTime)}
                  </td>
                  <td className="max-w-[240px] px-4 py-2.5 text-brand-900/85">
                    <span className="line-clamp-2">{row.description}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="chip">{OVERTIME_TYPE_LABELS[row.overtimeType] || row.overtimeType}</span>
                    {isAcc && (
                      <span className="chip ml-1 !border-gold-600/50 !bg-gold-300/40 !text-gold-700"><Lock size={10} className="mr-1 inline" aria-hidden="true" />ACC</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-xs font-semibold text-indonesia">{formatRupiah(row.fee)}</td>
                  <td className="px-4 py-2.5">
                    {isAcc ? (
                      <span className="text-center text-[10px] text-brand-900/45">terkunci</span>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5">
                        <button type="button" className="icon-btn" onClick={() => onEdit(row)} aria-label="Edit data lembur" title="Edit">
                          <Pencil size={14} aria-hidden="true" />
                        </button>
                        <button type="button" className="icon-btn" onClick={() => setPendingDelete(row)} aria-label="Hapus data lembur" title="Hapus">
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center">
                  <Inbox size={28} className="mx-auto text-brand-200" aria-hidden="true" />
                  <p className="mt-2 text-sm font-semibold text-brand-800/70">Belum ada data lembur</p>
                  <p className="mt-0.5 text-xs text-brand-800/45">Tambah data lewat form di atas, atau ubah filter.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-600/10 px-4 py-2.5 text-[11px] text-brand-900/55 sm:px-5">
        <span>
          {sorted.length === 0
            ? '0 data'
            : `Menampilkan ${start + 1}–${Math.min(start + PAGE_SIZE, sorted.length)} dari ${sorted.length} data`}
        </span>
        <div className="flex items-center gap-1.5">
          <button type="button" className="icon-btn !h-7 !w-7" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Halaman sebelumnya">
            <ChevronLeft size={13} aria-hidden="true" />
          </button>
          <span className="min-w-[44px] text-center font-mono">{safePage} / {totalPages}</span>
          <button type="button" className="icon-btn !h-7 !w-7" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Halaman berikutnya">
            <ChevronRight size={13} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Dialog konfirmasi hapus */}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Hapus Data Lembur?"
        message="Data yang dihapus tidak dapat dikembalikan."
        detail={pendingDelete ? `${formatIndonesianDate(pendingDelete.date)} · ${formatTimeDots(pendingDelete.startTime)}–${formatTimeDots(pendingDelete.endTime)} · ${pendingDelete.description} · ${formatRupiah(pendingDelete.fee)}` : null}
        confirmLabel="Ya, Hapus"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
