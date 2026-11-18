import { useEffect, useMemo, useState } from 'react'
import { Save, XCircle } from 'lucide-react'
import {
  OVERTIME_TYPES,
  calculateFee,
  suggestOvertimeType,
  isOvernightType,
  FEE,
} from '../lib/calculateFee'
import { getDayType, addMinutesToTime, formatIndonesianDateLong } from '../utils/dateUtils'
import { formatRupiah } from '../utils/currencyUtils'
import DatePicker from './DatePicker'

const EMPTY_FORM = {
  date: '',
  startHour: '05',
  startMinute: '30',
  hours: 1,
  minutes: 30,
  description: '',
  overtimeType: 'pagi',
}

/** Normalisasi jam/menit mulai menjadi 'HH:mm' (format 24 jam). Null bila tidak valid. */
function normalizeStartTime(hour, minute) {
  const h = Number(hour)
  const m = Number(minute)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null
  if (h < 0 || h > 23 || m < 0 || m > 59) return null
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function todayISO() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export default function OvertimeForm({ editingRecord, onAdd, onUpdate, onCancelEdit, saving }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, date: todayISO() })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState(false)

  const isEditing = Boolean(editingRecord)

  // Isi form saat mode edit
  useEffect(() => {
    if (editingRecord) {
      const dur = Number(editingRecord.durationMinutes) || 0
      const [h = '05', m = '30'] = String(editingRecord.startTime || '05:30').split(':')
      setForm({
        date: editingRecord.date || todayISO(),
        startHour: h,
        startMinute: m,
        hours: Math.floor(dur / 60),
        minutes: dur % 60,
        description: editingRecord.description || '',
        overtimeType: editingRecord.overtimeType || 'pagi',
      })
      setErrors({})
      setTouched(false)
    }
  }, [editingRecord])

  const dayType = useMemo(() => getDayType(form.date), [form.date])

  // Jam mulai 'HH:mm' (format 24 jam Indonesia) — null bila tidak valid
  const startTime = useMemo(
    () => normalizeStartTime(form.startHour, form.startMinute),
    [form.startHour, form.startMinute],
  )

  // Saat tipe hari berubah (weekday <-> weekend), saran jenis lembur ikut menyesuaikan
  useEffect(() => {
    setForm((prev) => {
      const isWeekendType = prev.overtimeType.startsWith('weekend')
      if ((dayType === 'weekend' && !isWeekendType) || (dayType === 'weekday' && isWeekendType)) {
        return { ...prev, overtimeType: suggestOvertimeType(dayType, prev.hours * 60 + prev.minutes) }
      }
      return prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayType])

  const durationMinutes = (Number(form.hours) || 0) * 60 + (Number(form.minutes) || 0)

  // Weekend: jenis halfday/fullday otomatis mengikuti durasi (<4j / ≥4j)
  useEffect(() => {
    setForm((prev) => {
      if (prev.overtimeType === 'weekend_halfday' && durationMinutes >= 240) {
        return { ...prev, overtimeType: 'weekend_fullday' }
      }
      if (prev.overtimeType === 'weekend_fullday' && durationMinutes > 0 && durationMinutes < 240) {
        return { ...prev, overtimeType: 'weekend_halfday' }
      }
      return prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMinutes])

  const { endTime, nextDay } = useMemo(
    () => addMinutesToTime(startTime || '00:00', durationMinutes),
    [startTime, durationMinutes],
  )

  const fee = useMemo(
    () =>
      calculateFee({
        dayType,
        overtimeType: form.overtimeType,
        startTime: startTime || '99:99', // waktu tidak valid → fee pagi = 0
        durationMinutes,
      }),
    [dayType, form.overtimeType, startTime, durationMinutes],
  )

  const validate = () => {
    const next = {}
    if (!form.date) next.date = 'Tanggal wajib diisi'
    if (!startTime) next.startTime = 'Jam mulai tidak valid (jam 00–23, menit 00–59)'
    if (durationMinutes <= 0) next.duration = 'Durasi harus lebih dari 0 menit'
    if (!form.description.trim()) next.description = 'Keterangan tidak boleh kosong'
    if (!form.overtimeType) next.overtimeType = 'Jenis lembur wajib dipilih'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setTouched(true)
    if (!validate()) return

    const payload = {
      date: form.date,
      startTime,
      durationMinutes,
      endTime,
      description: form.description.trim(),
      overtimeType: form.overtimeType,
      fee,
      dayType,
      isOvernight: isOvernightType(form.overtimeType),
      acc: false,
    }

    if (isEditing) {
      const { acc, ...editable } = payload
      onUpdate(editingRecord.id, editable)
    } else {
      onAdd(payload)
      setForm({ ...EMPTY_FORM, date: form.date, startHour: form.startHour, startMinute: form.startMinute })
      setTouched(false)
    }
  }

  // Validasi live hanya setelah submit pertama
  useEffect(() => {
    if (touched) validate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, touched])

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const morningHint = startTime && (form.overtimeType === 'pagi' || form.overtimeType === 'pagi_malam')
    ? startTime <= '06:00'
      ? `Jam masuk ${startTime.replace(':', '.')} → fee pagi Rp${FEE.MORNING_MAX.toLocaleString('id-ID')}`
      : startTime <= '07:00'
        ? `Jam masuk ${startTime.replace(':', '.')} → fee pagi Rp${FEE.MORNING_LATE.toLocaleString('id-ID')}`
        : `Jam masuk ${startTime.replace(':', '.')} → tidak dapat fee pagi`
    : null

  return (
    <form onSubmit={handleSubmit} className="card flex h-full flex-col p-4 sm:p-5" noValidate>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-bold text-brand-950">{isEditing ? 'Edit Data Lembur' : 'Tambah Lembur'}</h2>
        {isEditing && (
          <button type="button" onClick={onCancelEdit} className="btn-ghost !px-3 !py-1.5 !text-xs">
            <XCircle size={14} /> Batal
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Tanggal */}
        <div className="sm:col-span-2">
          <label htmlFor="tanggal" className="label">Tanggal Lembur *</label>
          <DatePicker
            id="tanggal"
            value={form.date}
            onChange={(v) => setField('date', v)}
            invalid={Boolean(errors.date)}
            ariaLabel="Pilih tanggal lembur"
          />
          {form.date && (
            <p className="mt-1.5 text-[11px] text-brand-900/60">
              {formatIndonesianDateLong(form.date)} ·{' '}
              <span className="font-semibold text-indonesia">{dayType === 'weekend' ? 'Weekend' : 'Hari Kerja'}</span>
            </p>
          )}
          {errors.date && <p className="mt-1.5 text-xs text-indonesia">{errors.date}</p>}
        </div>

        {/* Jam mulai — format 24 jam (Indonesia), tanpa AM/PM */}
        <div>
          <span className="label" id="jam-mulai-label">Jam Mulai (24 jam) *</span>
          <div className="flex items-center gap-2" role="group" aria-labelledby="jam-mulai-label">
            <input
              type="number"
              min="0"
              max="23"
              inputMode="numeric"
              placeholder="05"
              aria-label="Jam (00–23)"
              className={`input text-center font-mono ${errors.startTime ? 'input-error' : ''}`}
              value={form.startHour}
              onChange={(e) => setField('startHour', e.target.value)}
            />
            <span className="font-mono text-lg font-bold text-brand-800/60">:</span>
            <input
              type="number"
              min="0"
              max="59"
              inputMode="numeric"
              placeholder="30"
              aria-label="Menit (00–59)"
              className={`input text-center font-mono ${errors.startTime ? 'input-error' : ''}`}
              value={form.startMinute}
              onChange={(e) => setField('startMinute', e.target.value)}
            />
            <span className="text-[11px] font-semibold text-brand-800/55">WIB</span>
          </div>
          <p className="mt-1 text-[11px] text-brand-900/55">Format 24 jam — contoh 05:30 atau 17:00</p>
          {errors.startTime && <p className="mt-0.5 text-xs text-indonesia">{errors.startTime}</p>}
        </div>

        {/* Jam selesai (otomatis) */}
        <div>
          <label htmlFor="jam-selesai" className="label">Jam Selesai (otomatis)</label>
          <input
            id="jam-selesai"
            type="text"
            readOnly
            className="input cursor-default border-dashed bg-brand-50 font-mono text-brand-900/60"
            value={`${endTime.replace(':', '.')}${nextDay ? ' (+1 hari)' : ''}`}
            aria-live="polite"
          />
        </div>

        {/* Durasi */}
        <div className="sm:col-span-2">
          <span className="label" id="durasi-label">Durasi Lembur *</span>
          <div className="flex items-center gap-2" role="group" aria-labelledby="durasi-label">
            <input
              type="number"
              min="0"
              max="24"
              inputMode="numeric"
              aria-label="Durasi (jam)"
              className={`input font-mono ${errors.duration ? 'input-error' : ''}`}
              value={form.hours}
              onChange={(e) => setField('hours', e.target.value)}
            />
            <span className="text-xs text-brand-800/60">jam</span>
            <input
              type="number"
              min="0"
              max="59"
              inputMode="numeric"
              aria-label="Durasi (menit)"
              className={`input font-mono ${errors.duration ? 'input-error' : ''}`}
              value={form.minutes}
              onChange={(e) => setField('minutes', e.target.value)}
            />
            <span className="text-xs text-brand-800/60">menit</span>
          </div>
          {errors.duration && <p className="mt-1.5 text-xs text-indonesia">{errors.duration}</p>}
          {dayType === 'weekend' && (
            <p className="mt-1.5 text-[11px] text-brand-900/55">Weekend: &lt; 4 jam → Rp{FEE.WEEKEND_HALFDAY.toLocaleString('id-ID')} · ≥ 4 jam → Rp{FEE.WEEKEND_FULLDAY.toLocaleString('id-ID')}</p>
          )}
        </div>

        {/* Jenis lembur */}
        <div className="sm:col-span-2">
          <label htmlFor="jenis" className="label">Jenis Lembur *</label>
          <select
            id="jenis"
            className={`input ${errors.overtimeType ? 'input-error' : ''}`}
            value={form.overtimeType}
            onChange={(e) => setField('overtimeType', e.target.value)}
          >
            <optgroup label="Weekday (Senin–Jumat)">
              {OVERTIME_TYPES.filter((t) => t.group.startsWith('Weekday')).map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </optgroup>
            <optgroup label="Weekend (Sabtu–Minggu)">
              {OVERTIME_TYPES.filter((t) => t.group.startsWith('Weekend')).map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </optgroup>
          </select>
          {errors.overtimeType && <p className="mt-1.5 text-xs text-indonesia">{errors.overtimeType}</p>}
          {morningHint && <p className="mt-1.5 text-[11px] text-brand-900/55">{morningHint}</p>}
        </div>

        {/* Keterangan */}
        <div className="sm:col-span-2">
          <label htmlFor="keterangan" className="label">Keterangan *</label>
          <input
            id="keterangan"
            type="text"
            placeholder="Contoh: Support operasional pagi / migrasi data…"
            className={`input ${errors.description ? 'input-error' : ''}`}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            maxLength={140}
          />
          {errors.description
            ? <p className="mt-1.5 text-xs text-indonesia">{errors.description}</p>
            : <p className="mt-1.5 text-right text-[10px] text-brand-900/40">{form.description.length}/140</p>}
        </div>
      </div>

      {/* Fee otomatis + tombol simpan */}
      <div className="mt-4 flex flex-col gap-3 border-t border-brand-600/15 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="label !mb-0.5">Fee (otomatis)</p>
          <p className="font-mono text-xl font-semibold text-indonesia">{formatRupiah(fee)}</p>
          {isOvernightType(form.overtimeType) && (
            <p className="mt-0.5 text-[10px] text-brand-900/55">Overnight menggantikan fee pagi/malam (tidak di-stack)</p>
          )}
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          <Save size={16} aria-hidden="true" />
          {saving ? 'Menyimpan…' : isEditing ? 'Simpan Perubahan' : 'Simpan Lembur'}
        </button>
      </div>
    </form>
  )
}
