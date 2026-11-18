import { useEffect, useMemo, useState } from 'react'
import { Save, XCircle } from 'lucide-react'
import {
  OVERTIME_TYPES,
  calculateFee,
  suggestOvertimeType,
  isOvernightType,
  FEE,
} from '../lib/calculateFee'
import { getDayType, addMinutesToTime, formatIndonesianDateLong, formatDuration } from '../utils/dateUtils'
import { formatRupiah } from '../utils/currencyUtils'
import DatePicker from './DatePicker'
import { TYPE_INFO } from '../lib/overtimeTypeInfo'

const EMPTY_FORM = {
  date: '',
  startHour: '05',
  startMinute: '30',
  endHour: '07',
  endMinute: '00',
  hours: 1,
  minutes: 30,
  description: '',
  overtimeType: 'pagi',
}

/** Normalisasi jam/menit mulai menjadi 'HH:mm' (format 24 jam). Null bila tidak valid. */
function normalizeTime(hour, minute) {
  const h = Number(hour)
  const m = Number(minute)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null
  if (h < 0 || h > 23 || m < 0 || m > 59) return null
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const timeToMinutes = (t) => {
  const [h, m] = String(t).split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/** Jenis lembur yang durasinya dihitung otomatis dari jam selesai (Pagi, Malam & Pagi+Malam) */
const isMorningNightType = (t) => t === 'pagi' || t === 'malam' || t === 'pagi_malam'

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
      const [eh = '07', em = '00'] = String(editingRecord.endTime || '07:00').split(':')
      setForm({
        date: editingRecord.date || todayISO(),
        startHour: h,
        startMinute: m,
        endHour: eh,
        endMinute: em,
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
    () => normalizeTime(form.startHour, form.startMinute),
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

  // Jam selesai (input manual) — hanya dipakai untuk Pagi & Malam
  const endTimeInput = useMemo(
    () => normalizeTime(form.endHour, form.endMinute),
    [form.endHour, form.endMinute],
  )

  const isMorningNight = isMorningNightType(form.overtimeType)

  // Durasi & jam selesai dihitung otomatis sesuai jenis lembur
  const computed = useMemo(() => {
    if (isMorningNightType(form.overtimeType)) {
      if (!startTime || !endTimeInput) {
        return { durationMinutes: 0, endTime: '', nextDay: false, endInvalid: true }
      }
      const startMin = timeToMinutes(startTime)
      const endMin = timeToMinutes(endTimeInput)
      let diff = endMin - startMin
      const nextDay = diff <= 0
      if (diff <= 0) diff += 1440
      // jam selesai sama dengan jam mulai = tidak valid
      if (diff === 1440) diff = 0
      return { durationMinutes: diff, endTime: endTimeInput, nextDay, endInvalid: diff === 0 }
    }
    const dur = (Number(form.hours) || 0) * 60 + (Number(form.minutes) || 0)
    const res = addMinutesToTime(startTime || '00:00', dur)
    return { durationMinutes: dur, endTime: res.endTime, nextDay: res.nextDay, endInvalid: false }
  }, [form.overtimeType, form.hours, form.minutes, startTime, endTimeInput])

  const { durationMinutes, endTime, nextDay, endInvalid } = computed

  // Weekend: jenis halfday/fullday otomatis mengikuti durasi (<4j / ≥4j)
  // (hanya untuk jenis non-Pagi/Malam yang durasinya manual)
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
    if (isMorningNight) {
      if (!endTimeInput) next.endTime = 'Jam selesai tidak valid (jam 00–23, menit 00–59)'
      else if (endInvalid) next.endTime = 'Jam selesai tidak boleh sama dengan jam mulai'
    } else if (durationMinutes <= 0) {
      next.duration = 'Durasi harus lebih dari 0 menit'
    }
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
      setForm({ ...EMPTY_FORM, date: form.date })
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

        {/* Jam selesai — editable (pagi/malam) / otomatis (jenis lainnya) */}
        <div>
          {isMorningNight ? (
            <>
              <span className="label" id="jam-selesai-label">Jam Selesai (24 jam) *</span>
              <div className="flex items-center gap-2" role="group" aria-labelledby="jam-selesai-label">
                <input
                  type="number"
                  min="0"
                  max="23"
                  inputMode="numeric"
                  placeholder="07"
                  aria-label="Jam selesai (00–23)"
                  className={`input text-center font-mono ${errors.endTime ? 'input-error' : ''}`}
                  value={form.endHour}
                  onChange={(e) => setField('endHour', e.target.value)}
                />
                <span className="font-mono text-lg font-bold text-brand-800/60">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  inputMode="numeric"
                  placeholder="00"
                  aria-label="Menit selesai (00–59)"
                  className={`input text-center font-mono ${errors.endTime ? 'input-error' : ''}`}
                  value={form.endMinute}
                  onChange={(e) => setField('endMinute', e.target.value)}
                />
                <span className="text-[11px] font-semibold text-brand-800/55">WIB</span>
              </div>
              <p className="mt-1 text-[11px] text-brand-900/55">
                Selesai {nextDay ? 'besoknya' : 'di hari yang sama'} — durasi dihitung otomatis
              </p>
              {errors.endTime && <p className="mt-0.5 text-xs text-indonesia">{errors.endTime}</p>}
            </>
          ) : (
            <>
              <label htmlFor="jam-selesai" className="label">Jam Selesai (otomatis)</label>
              <input
                id="jam-selesai"
                type="text"
                readOnly
                className="input cursor-default border-dashed bg-brand-50 font-mono text-brand-900/60"
                value={`${(endTime || '').replace(':', '.')}${nextDay ? ' (+1 hari)' : ''}`}
                aria-live="polite"
              />
            </>
          )}
        </div>

        {/* Durasi — manual untuk jenis lainnya; otomatis untuk Pagi/Malam */}
        <div className="sm:col-span-2">
          {isMorningNight ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold-500/50 bg-gold-400/15 px-4 py-3">
              <div>
                <p className="label !mb-0.5">Durasi Lembur (otomatis)</p>
                <p className="font-mono text-xl font-semibold text-brand-950">
                  {durationMinutes > 0 ? formatDuration(durationMinutes) : '—'}
                </p>
              </div>
              <p className="max-w-[220px] text-right text-[10px] leading-snug text-brand-900/55">
                Dihitung otomatis dari<br />jam mulai &amp; jam selesai
              </p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Jenis lembur */}
        <div className="sm:col-span-2">
          <label htmlFor="jenis" className="label">Jenis Lembur *</label>
          <select
            id="jenis"
            className={`input ${errors.overtimeType ? 'input-error' : ''}`}
            value={form.overtimeType}
            onChange={(e) => {
              const nextType = e.target.value
              setForm((prev) => {
                const next = { ...prev, overtimeType: nextType }
                // Pagi + Malam: saran jam mulai 06.00 & jam selesai 20.00
                if (nextType === 'pagi_malam') {
                  next.startHour = '06'
                  next.startMinute = '00'
                  next.endHour = '20'
                  next.endMinute = '00'
                } else if (nextType === 'pagi' && prev.overtimeType !== 'pagi') {
                  next.startHour = '05'
                  next.startMinute = '30'
                  next.endHour = '07'
                  next.endMinute = '00'
                } else if (nextType === 'malam' && prev.overtimeType !== 'malam') {
                  next.startHour = '17'
                  next.startMinute = '00'
                  next.endHour = '20'
                  next.endMinute = '00'
                }
                return next
              })
            }}
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
          <details className="mt-2 rounded-lg border border-brand-600/15 bg-brand-50 px-3 py-2">
            <summary className="cursor-pointer text-[11px] font-semibold text-brand-800/80 transition hover:text-brand-950">
              Keterangan setiap jenis lembur
            </summary>
            <ul className="mt-1.5 space-y-1 text-[10px] leading-snug text-brand-900/70">
              {TYPE_INFO.map((t) => (
                <li key={t.value}>
                  <span className="font-bold text-brand-900">{t.label}</span> — {t.desc}
                </li>
              ))}
            </ul>
          </details>
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
