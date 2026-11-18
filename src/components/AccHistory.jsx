import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Archive, FileSpreadsheet, FileText, Trash2, Info } from 'lucide-react'
import { formatRupiah } from '../utils/currencyUtils'
import { formatDecimalHours } from '../utils/dateUtils'
import ConfirmDialog from './ConfirmDialog'

// Riwayat rekap yang sudah di-ACC, dikelompokkan per batch ACC
export default function AccHistory({ records, onExport, onDeleteBatch, exportingBatch, deletingBatch }) {
  const [open, setOpen] = useState(false)
  const [pendingBatch, setPendingBatch] = useState(null)

  const batches = useMemo(() => {
    const groups = new Map()
    for (const row of records) {
      if (!row.acc) continue
      const key = row.batchId || 'unknown'
      if (!groups.has(key)) {
        groups.set(key, {
          batchId: key,
          label: row.batchLabel || 'Rekap ACC',
          accAt: row.accAt || null,
          items: [],
          fee: 0,
          minutes: 0,
          days: new Set(),
        })
      }
      const g = groups.get(key)
      g.items.push(row)
      g.fee += Number(row.fee) || 0
      g.minutes += Number(row.durationMinutes) || 0
      g.days.add(row.date)
      if (row.accAt && (!g.accAt || row.accAt > g.accAt)) g.accAt = row.accAt
    }
    return [...groups.values()]
      .map((g) => ({ ...g, count: g.items.length, totalDays: g.days.size }))
      .sort((a, b) => String(b.accAt).localeCompare(String(a.accAt)))
  }, [records])

  const totalFee = batches.reduce((s, b) => s + b.fee, 0)

  return (
    <section id="riwayat" className="card scroll-mt-20" aria-label="Riwayat ACC">
      {/* Header (collapsible) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-brand-50 sm:px-5"
        aria-expanded={open}
      >
        <Archive size={17} className="text-gold-600" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-brand-950">Riwayat Rekap (Sudah ACC)</span>
          <span className="block text-[11px] text-brand-900/55">
            {batches.length} rekap terkunci · total {formatRupiah(totalFee)} · arsip dihapus otomatis setelah 3 bulan
          </span>
        </span>
        {open
          ? <ChevronDown size={16} className="text-brand-800/50" aria-hidden="true" />
          : <ChevronRight size={16} className="text-brand-800/50" aria-hidden="true" />}
      </button>

      {open && (
        <div className="border-t border-brand-600/15">
          {batches.length === 0 ? (
            <p className="flex items-center gap-2 px-5 py-5 text-xs text-brand-900/55">
              <Info size={14} className="shrink-0" aria-hidden="true" />
              Belum ada rekap yang di-ACC. Tekan tombol "ACC Rekap Ini" di panel rekap bila periode sudah disetujui atasan.
            </p>
          ) : (
            <ul className="divide-y divide-brand-600/10">
              {batches.map((batch) => (
                <li key={batch.batchId} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-brand-950">{batch.label}</p>
                    <p className="mt-0.5 text-[10px] text-brand-900/55">
                      {batch.items.length > 0 && `${batch.items.length} data · ${batch.totalDays} hari · ${formatDecimalHours(batch.minutes)} jam · `}
                      {batch.accAt && `di-ACC ${new Date(batch.accAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                    </p>
                    <p className="mt-0.5 font-mono text-xs font-semibold text-indonesia">{formatRupiah(batch.fee)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button type="button" className="icon-btn" onClick={() => onExport(batch, 'excel')} disabled={exportingBatch === batch.batchId} aria-label="Export Excel batch ini" title="Export Excel">
                      <FileSpreadsheet size={15} className="text-emerald-700" aria-hidden="true" />
                    </button>
                    <button type="button" className="icon-btn" onClick={() => onExport(batch, 'pdf')} disabled={exportingBatch === batch.batchId} aria-label="Export PDF batch ini" title="Export PDF">
                      <FileText size={15} className="text-indonesia" aria-hidden="true" />
                    </button>
                    <button type="button" className="icon-btn" onClick={() => setPendingBatch(batch)} disabled={deletingBatch === batch.batchId} aria-label="Hapus batch ini" title="Hapus batch">
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Konfirmasi hapus batch */}
      <ConfirmDialog
        open={Boolean(pendingBatch)}
        title="Hapus Rekap ACC?"
        message="Seluruh data dalam rekap ini akan dihapus permanen."
        detail={pendingBatch ? `${pendingBatch.label} · ${pendingBatch.count} data · ${formatRupiah(pendingBatch.fee)}` : null}
        confirmLabel="Ya, Hapus Rekap"
        loading={Boolean(deletingBatch)}
        onConfirm={() => {
          const batch = pendingBatch
          setPendingBatch(null)
          onDeleteBatch(batch)
        }}
        onCancel={() => setPendingBatch(null)}
      />
    </section>
  )
}
