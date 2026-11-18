import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Menu, WifiOff, AlertCircle, Sparkles } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import DashboardCards from '../components/DashboardCards'
import OvertimeForm from '../components/OvertimeForm'
import OvertimeTable from '../components/OvertimeTable'
import FilterBar, { DEFAULT_FILTERS } from '../components/FilterBar'
import SummaryPanel, { FeeRules } from '../components/SummaryPanel'
import AccHistory from '../components/AccHistory'
import ToastContainer from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import ProfileDialog from '../components/ProfileDialog'
import PdfPreviewModal from '../components/PdfPreviewModal'
import { getProfile, saveProfile } from '../services/profileService'
import {
  subscribeOvertime,
  addOvertime,
  updateOvertime,
  deleteOvertime,
  deleteOvertimeMany,
  accAllPending,
  purgeAccOlderThanDays,
  usingFirebase,
} from '../services/overtimeService'
import { computeSummary } from '../lib/reportSummary'
import { periodeFromRecords, formatIndonesianDateLong } from '../utils/dateUtils'
import { formatRupiah } from '../utils/currencyUtils'

const matchesFilters = (row, filters) => {
  if (filters.month !== 'all') {
    const monthIndex = Number(String(row.date).split('-')[1]) - 1
    if (String(monthIndex) !== filters.month) return false
  }
  if (filters.year !== 'all' && !String(row.date).startsWith(filters.year)) return false
  if (filters.type !== 'all' && row.overtimeType !== filters.type) return false
  if (filters.search) {
    const q = filters.search.trim().toLowerCase()
    if (q && !String(row.description || '').toLowerCase().includes(q)) return false
  }
  if (filters.from && row.date < filters.from) return false
  if (filters.to && row.date > filters.to) return false
  return true
}

export default function Dashboard() {
  const [overtimes, setOvertimes] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [online, setOnline] = useState(() => navigator.onLine)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [editingRecord, setEditingRecord] = useState(null)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(null) // 'excel' | 'pdf' | 'batch-excel' | ...
  const [exportingBatch, setExportingBatch] = useState(null)
  const [deletingBatch, setDeletingBatch] = useState(null)
  const [accOpen, setAccOpen] = useState(false)
  const [accLoading, setAccLoading] = useState(false)
  const [profile, setProfile] = useState(() => getProfile())
  const [profileOpen, setProfileOpen] = useState(false)
  const [pdfPreview, setPdfPreview] = useState(null) // { url, fileName, subtitle }
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)
  const purgedRef = useRef(false)

  const showToast = useCallback((message, type = 'success') => {
    toastId.current += 1
    const id = toastId.current
    setToasts((prev) => [...prev.slice(-2), { id, message, type }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Status koneksi
  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  // Langganan data realtime (Firestore onSnapshot / fallback lokal)
  useEffect(() => {
    const unsubscribe = subscribeOvertime(
      (rows) => {
        setOvertimes(rows)
        setLoading(false)
        setLoadError(null)
      },
      (error) => {
        setLoading(false)
        setLoadError(error?.message || 'Gagal memuat data')
      },
    )
    return () => unsubscribe?.()
  }, [])

  // Purge otomatis: data ACC lebih dari 3 bulan dihapus setelah aplikasi dibuka
  useEffect(() => {
    if (loading || purgedRef.current) return
    purgedRef.current = true
    purgeAccOlderThanDays(92)
      .then((res) => {
        if (res?.deleted > 0) showToast(`${res.deleted} data ACC (>3 bulan) dihapus otomatis`, 'info')
      })
      .catch((error) => console.warn('Purge gagal:', error))
  }, [loading, showToast])

  // ── Rekap aktif = SEMUA data yang belum di-ACC ─────────────────────────
  const pending = useMemo(() => overtimes.filter((r) => !r.acc), [overtimes])
  const archived = useMemo(() => overtimes.filter((r) => r.acc), [overtimes])
  const rekapSummary = useMemo(() => computeSummary(pending), [pending])
  const rekapPeriode = useMemo(() => periodeFromRecords(pending), [pending])

  // ── Tabel = semua data dengan filter (termasuk status ACC) ─────────────
  const tableRows = useMemo(() => {
    return overtimes.filter((row) => {
      if (!matchesFilters(row, filters)) return false
      if (filters.status === 'pending' && row.acc) return false
      if (filters.status === 'acc' && !row.acc) return false
      return true
    })
  }, [overtimes, filters])

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), [])

  // ── Handlers: CRUD ─────────────────────────────────────────────────────
  const handleAdd = useCallback(async (payload) => {
    setSaving(true)
    try {
      await addOvertime(payload)
      showToast('Data lembur berhasil disimpan', 'success')
    } catch (error) {
      console.error(error)
      showToast('Gagal menyimpan data. Check koneksi / Firestore rules.', 'error')
    } finally {
      setSaving(false)
    }
  }, [showToast])

  const handleUpdate = useCallback(async (id, payload) => {
    setSaving(true)
    try {
      await updateOvertime(id, payload)
      setEditingRecord(null)
      showToast('Perubahan berhasil disimpan', 'success')
    } catch (error) {
      console.error(error)
      showToast('Gagal memperbarui data.', 'error')
    } finally {
      setSaving(false)
    }
  }, [showToast])

  const handleEdit = useCallback((record) => {
    setEditingRecord(record)
    document.getElementById('input-lembur')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleDelete = useCallback(async (record) => {
    try {
      await deleteOvertime(record.id)
      if (editingRecord?.id === record.id) setEditingRecord(null)
      showToast('Data lembur dihapus', 'info')
    } catch (error) {
      console.error(error)
      showToast('Gagal menghapus data.', 'error')
      throw error
    }
  }, [editingRecord, showToast])

  const handleSaveProfile = useCallback((next) => {
    const saved = saveProfile(next)
    setProfile(saved)
    setProfileOpen(false)
    showToast('Profil tersimpan', 'success')
  }, [showToast])

  // ── Handlers: Export (export = rekap aktif, semua belum ACC) ───────────
  const handleExport = useCallback((format) => {
    setExporting(format)
    ;(async () => {
      try {
        if (format === 'excel') {
          const { exportOvertimeExcel } = await import('../lib/exportExcel')
          const fileName = exportOvertimeExcel(pending, rekapSummary, profile)
          showToast(`File ${fileName} berhasil dibuat`, 'success')
          if (!profile?.nama) showToast('Tips: isi Profil (Nama/Divisi/Jabatan) di sidebar agar tercetak di laporan', 'info')
        } else {
          const { generateOvertimePDF } = await import('../lib/exportPDF')
          const { blob, fileName, periodeLabel } = generateOvertimePDF(pending, rekapSummary, profile)
          setPdfPreview({
            url: URL.createObjectURL(blob),
            fileName,
            subtitle: `Periode ${periodeLabel} · ${rekapSummary.totalRecords} data · ${formatRupiah(rekapSummary.totalFee)}`,
          })
          if (!profile?.nama) showToast('Tips: isi Profil (Nama/Divisi/Jabatan) di sidebar agar tercetak di laporan', 'info')
        }
      } catch (error) {
        console.error(error)
        showToast(`Gagal membuat file ${format === 'excel' ? 'Excel' : 'PDF'}`, 'error')
      } finally {
        setExporting(null)
      }
    })()
  }, [pending, rekapSummary, profile, showToast])

  const handleExportBatch = useCallback((batch, format) => {
    setExportingBatch(batch.batchId)
    ;(async () => {
      try {
        const batchSummary = computeSummary(batch.items)
        if (format === 'excel') {
          const { exportOvertimeExcel } = await import('../lib/exportExcel')
          const fileName = exportOvertimeExcel(batch.items, batchSummary, profile)
          showToast(`File ${fileName} berhasil dibuat`, 'success')
        } else {
          const { generateOvertimePDF } = await import('../lib/exportPDF')
          const { blob, fileName, periodeLabel } = generateOvertimePDF(batch.items, batchSummary, profile)
          setPdfPreview({
            url: URL.createObjectURL(blob),
            fileName,
            subtitle: `Periode ${periodeLabel} · ${batch.items.length} data · ${formatRupiah(batchSummary.totalFee)}`,
          })
        }
      } catch (error) {
        console.error(error)
        showToast('Gagal membuat file', 'error')
      } finally {
        setExportingBatch(null)
      }
    })()
  }, [profile, showToast])

  const handleDeleteBatch = useCallback(async (batch) => {
    setDeletingBatch(batch.batchId)
    try {
      await deleteOvertimeMany(batch.items.map((item) => item.id))
      showToast(`Rekap "${batch.label}" dihapus (${batch.items.length} data)`, 'info')
    } catch (error) {
      console.error(error)
      showToast('Gagal menghapus rekap', 'error')
    } finally {
      setDeletingBatch(null)
    }
  }, [showToast])

  const handleDownloadPdf = useCallback(() => {
    setPdfPreview((prev) => {
      if (prev?.url) {
        const link = document.createElement('a')
        link.href = prev.url
        link.download = prev.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(prev.url)
        showToast(`File ${prev.fileName} berhasil diunduh`, 'success')
      }
      return null
    })
  }, [showToast])

  const handleClosePdfPreview = useCallback(() => {
    setPdfPreview((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url)
      return null
    })
  }, [])

  // ── Handlers: ACC ──────────────────────────────────────────────────────
  const handleAccConfirm = useCallback(async () => {
    setAccLoading(true)
    try {
      const result = await accAllPending()
      if (result) {
        showToast(`Rekap di-ACC: ${result.label} — ${result.count} data (${formatRupiah(result.fee)}) terkunci`, 'success')
      } else {
        showToast('Tidak ada data yang belum di-ACC', 'info')
      }
      setAccOpen(false)
    } catch (error) {
      console.error(error)
      showToast('Gagal meng-ACC rekap. Coba lagi.', 'error')
    } finally {
      setAccLoading(false)
    }
  }, [showToast])

  const today = formatIndonesianDateLong(
    (() => { const n = new Date(); const p = (v) => String(v).padStart(2, '0'); return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}` })(),
  )

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} usingFirebase={usingFirebase} profile={profile} onEditProfile={() => setProfileOpen(true)} />

      {/* Konten utama */}
      <div className="lg:pl-[260px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-brand-600/15 bg-[#fffdf8]/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
            <button type="button" className="icon-btn lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Buka menu">
              <Menu size={17} aria-hidden="true" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-bold text-brand-950">Dashboard Lembur</h1>
              <p className="hidden text-[10px] font-medium uppercase tracking-wide text-brand-800/55 sm:block">{today} · WIB</p>
            </div>
            {profile?.nama && (
              <span className="hidden text-[11px] font-semibold leading-tight text-brand-800/70 md:block">
                {profile.nama}
                {(profile.jabatan || profile.divisi) && (
                  <span className="block text-[9px] font-medium text-brand-800/50">{[profile.jabatan, profile.divisi].filter(Boolean).join(' · ')}</span>
                )}
              </span>
            )}
            <span className="chip">
              <Sparkles size={11} className="mr-1" aria-hidden="true" />
              {pending.length > 0 ? rekapPeriode.label : 'Belum ada lembur'}
            </span>
          </div>
          {/* Banner offline */}
          {!online && (
            <div className="border-t border-gold-500/40 bg-gold-400/15 px-4 py-1.5 text-center text-[11px] font-medium text-gold-700">
              <WifiOff size={12} className="mr-1 inline" aria-hidden="true" />
              Koneksi internet terputus — data mungkin belum tersinkron.
            </div>
          )}
        </header>

        <main className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6 sm:py-5">
          {/* Error banner */}
          {loadError && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-brand-600/40 bg-brand-50 px-4 py-2.5 text-xs text-brand-800">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span><strong>Gagal memuat data.</strong> {loadError}</span>
            </div>
          )}

          {loading ? (
            // Skeleton loading
            <div aria-busy="true" className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="card h-24 animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="card h-80 animate-pulse xl:col-span-2" />
                <div className="card h-80 animate-pulse" />
              </div>
              <div className="card h-64 animate-pulse" />
            </div>
          ) : (
            <>
              {/* ── Ringkasan (rekap aktif, belum ACC) ─────────────── */}
              <section id="ringkasan" className="scroll-mt-16" aria-label="Ringkasan lembur belum ACC">
                <DashboardCards summary={rekapSummary} periode={rekapPeriode.label} />
              </section>

              {/* ── Input + Rekap ─────────────────────────────────── */}
              <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
                <div id="input-lembur" className="scroll-mt-16 xl:col-span-2">
                  <OvertimeForm
                    editingRecord={editingRecord}
                    onAdd={handleAdd}
                    onUpdate={handleUpdate}
                    onCancelEdit={() => setEditingRecord(null)}
                    saving={saving}
                  />
                </div>
                <div className="scroll-mt-16 space-y-4">
                  <SummaryPanel
                    summary={rekapSummary}
                    periodeLabel={rekapPeriode.label}
                    periodeRange={rekapPeriode.rangeLabel}
                    pendingCount={pending.length}
                    onRequestAcc={() => setAccOpen(true)}
                    accLoading={accLoading}
                  />
                  <FeeRules />
                </div>
              </section>

              {/* ── Filter + Tabel + Export ───────────────────────── */}
              <section id="data-lembur" className="scroll-mt-16">
                <div className="card overflow-hidden">
                  <FilterBar
                    filters={filters}
                    onChange={setFilters}
                    onReset={resetFilters}
                    resultCount={tableRows.length}
                    activeLabel="filter tabel"
                  />
                  <OvertimeTable
                    records={tableRows}
                    onEdit={handleEdit}
                    onDeleteRequest={handleDelete}
                    onExportExcel={() => handleExport('excel')}
                    onExportPDF={() => handleExport('pdf')}
                    exporting={exporting}
                  />
                </div>
                <p className="mt-2 text-center text-[10px] text-brand-800/45">
                  Export Excel &amp; PDF berisi rekap aktif (semua lembur belum ACC) dengan periode otomatis dari tanggal data
                </p>
              </section>

              {/* ── Riwayat rekap yang sudah ACC ───────────────────── */}
              <AccHistory
                records={archived}
                onExport={handleExportBatch}
                onDeleteBatch={handleDeleteBatch}
                exportingBatch={exportingBatch}
                deletingBatch={deletingBatch}
              />
            </>
          )}
        </main>
      </div>

      {/* Pratinjau PDF */}
      <PdfPreviewModal
        open={Boolean(pdfPreview)}
        url={pdfPreview?.url}
        fileName={pdfPreview?.fileName}
        subtitle={pdfPreview?.subtitle}
        onClose={handleClosePdfPreview}
        onDownload={handleDownloadPdf}
      />

      {/* Dialog profil */}
      <ProfileDialog
        open={profileOpen}
        initialProfile={profile}
        onSave={handleSaveProfile}
        onCancel={() => setProfileOpen(false)}
      />

      {/* Dialog ACC */}
      <ConfirmDialog
        open={accOpen}
        tone="gold"
        title="ACC Rekap & Tutup Periode?"
        message="Semua lembur yang belum di-ACC akan dikunci. Setelah itu data tidak bisa diedit/dihapus dari tabel utama, dan rekap baru dimulai dari nol."
        detail={pending.length > 0
          ? `${rekapPeriode.rangeLabel} · ${pending.length} data · ${formatRupiah(rekapSummary.totalFee)} · arsip dihapus otomatis setelah 3 bulan`
          : 'Tidak ada data yang belum di-ACC'}
        confirmLabel="Ya, ACC Sekarang"
        loading={accLoading}
        onConfirm={handleAccConfirm}
        onCancel={() => setAccOpen(false)}
      />

      {/* Toast */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
