import { Search, RotateCcw, ChevronDown } from 'lucide-react'
import { BULAN_ID } from '../utils/dateUtils'
import { OVERTIME_TYPES } from '../lib/calculateFee'

export const DEFAULT_FILTERS = {
  month: 'all',
  year: 'all',
  type: 'all',
  search: '',
  from: '',
  to: '',
  status: 'pending', // Rekap aktif = data belum di-ACC
}

export default function FilterBar({ filters, onChange, onReset, resultCount, activeLabel }) {
  const set = (key, value) => onChange({ ...filters, [key]: value })
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i)

  return (
    <div className="border-b border-brand-600/15 px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[160px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-800/40" aria-hidden="true" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Cari keterangan…"
            aria-label="Cari keterangan lembur"
            className="input !pl-9"
          />
        </div>

        {/* Status ACC */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => set('status', e.target.value)}
            aria-label="Filter status ACC"
            className="input w-auto appearance-none !pr-8"
          >
            <option value="pending">Belum ACC</option>
            <option value="acc">Sudah ACC</option>
            <option value="all">Semua Data</option>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-800/50" aria-hidden="true" />
        </div>

        {/* Bulan */}
        <div className="relative">
          <select
            value={filters.month}
            onChange={(e) => set('month', e.target.value)}
            aria-label="Filter bulan"
            className="input w-auto appearance-none !pr-8"
          >
            <option value="all">Semua Bulan</option>
            {BULAN_ID.map((name, i) => (
              <option key={name} value={String(i)}>{name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-800/50" aria-hidden="true" />
        </div>

        {/* Tahun */}
        <div className="relative">
          <select
            value={filters.year}
            onChange={(e) => set('year', e.target.value)}
            aria-label="Filter tahun"
            className="input w-auto appearance-none !pr-8"
          >
            <option value="all">Semua Tahun</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-800/50" aria-hidden="true" />
        </div>

        {/* Jenis lembur */}
        <div className="relative">
          <select
            value={filters.type}
            onChange={(e) => set('type', e.target.value)}
            aria-label="Filter jenis lembur"
            className="input w-auto appearance-none !pr-8"
          >
            <option value="all">Semua Jenis</option>
            <optgroup label="Weekday">
              {OVERTIME_TYPES.filter((t) => t.group.startsWith('Weekday')).map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </optgroup>
            <optgroup label="Weekend">
              {OVERTIME_TYPES.filter((t) => t.group.startsWith('Weekend')).map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </optgroup>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-800/50" aria-hidden="true" />
        </div>

        {/* Reset */}
        <button type="button" onClick={onReset} className="btn-ghost !px-3" title="Reset semua filter">
          <RotateCcw size={14} aria-hidden="true" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Rentang tanggal + info hasil */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <label className="flex items-center gap-2 text-[11px] font-medium text-brand-800/70">
          Dari
          <input type="date" value={filters.from} onChange={(e) => set('from', e.target.value)} aria-label="Dari tanggal" className="input w-auto !py-1 !text-xs" />
        </label>
        <label className="flex items-center gap-2 text-[11px] font-medium text-brand-800/70">
          Sampai
          <input type="date" value={filters.to} onChange={(e) => set('to', e.target.value)} aria-label="Sampai tanggal" className="input w-auto !py-1 !text-xs" />
        </label>
        <span className="ml-auto text-[11px] font-medium text-brand-900/60">
          <span className="font-bold text-indonesia">{resultCount}</span> data · {activeLabel}
        </span>
      </div>
    </div>
  )
}
