// Keterangan jelas untuk jenis lembur — dipakai form, panel rekap, dan export Excel/PDF
export const TYPE_INFO = [
  { value: 'pagi',              label: 'Pagi',              desc: 'Jam masuk ≤ 06.00 → Rp30.000 · 06.01–07.00 → Rp20.000 · > 07.00 → tidak dapat fee pagi' },
  { value: 'malam',             label: 'Malam',             desc: 'Lembur setelah jam kerja (sore/malam/luar jam kantor) → Rp35.000' },
  { value: 'pagi_malam',        label: 'Pagi + Malam',      desc: 'Lembur pagi DAN malam di hari yang sama → pagi + Rp35.000 (maksimal Rp65.000)' },
  { value: 'overnight',         label: 'Overnight',         desc: 'Menginap lembur di hari kerja → Rp50.000 (menggantikan fee pagi/malam, tidak di-stack)' },
  { value: 'weekend_halfday',   label: 'Weekend Halfday',   desc: 'Weekend (Sabtu/Minggu) dengan durasi < 4 jam → Rp40.000' },
  { value: 'weekend_fullday',   label: 'Weekend Fullday',   desc: 'Weekend (Sabtu/Minggu) dengan durasi ≥ 4 jam → Rp80.000' },
  { value: 'weekend_overnight', label: 'Weekend Overnight', desc: 'Menginap lembur di weekend → Rp100.000 (menggantikan halfday/fullday)' },
]

/** Cari keterangan berdasarkan kode jenis lembur (untuk tooltip/chip) */
export function typeInfo(value) {
  return TYPE_INFO.find((t) => t.value === value) || null
}
