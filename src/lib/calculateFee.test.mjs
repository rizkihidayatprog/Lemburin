import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateFee, calculateMorningFee, FEE } from './calculateFee.js'

// ── Weekday pagi: batas jam 06.00 / 06.30 / 07.00 / 07.30 ──────────────
test('weekday pagi jam 06.00 → Rp30.000', () => {
  assert.equal(calculateFee({ dayType: 'weekday', overtimeType: 'pagi', startTime: '06:00', durationMinutes: 120 }), FEE.MORNING_MAX)
})
test('weekday pagi jam 05.30 → Rp30.000', () => {
  assert.equal(calculateFee({ dayType: 'weekday', overtimeType: 'pagi', startTime: '05:30', durationMinutes: 90 }), FEE.MORNING_MAX)
})
test('weekday pagi jam 06.30 → Rp20.000', () => {
  assert.equal(calculateFee({ dayType: 'weekday', overtimeType: 'pagi', startTime: '06:30', durationMinutes: 90 }), FEE.MORNING_LATE)
})
test('weekday pagi tepat 07.00 → Rp20.000', () => {
  assert.equal(calculateFee({ dayType: 'weekday', overtimeType: 'pagi', startTime: '07:00', durationMinutes: 60 }), FEE.MORNING_LATE)
})
test('weekday pagi jam 07.30 → Rp0', () => {
  assert.equal(calculateFee({ dayType: 'weekday', overtimeType: 'pagi', startTime: '07:30', durationMinutes: 60 }), 0)
})
test('morning fee helper: 05.59 → 30rb, 07.01 → 0', () => {
  assert.equal(calculateMorningFee('05:59'), 30000)
  assert.equal(calculateMorningFee('07:01'), 0)
})

// ── Weekday malam & gabungan ────────────────────────────────────────────
test('weekday malam → Rp35.000', () => {
  assert.equal(calculateFee({ dayType: 'weekday', overtimeType: 'malam', startTime: '17:00', durationMinutes: 180 }), FEE.NIGHT)
})
test('weekday pagi 06.00 + malam → Rp65.000', () => {
  assert.equal(calculateFee({ dayType: 'weekday', overtimeType: 'pagi_malam', startTime: '06:00', durationMinutes: 240 }), 65000)
})
test('weekday pagi 06.30 + malam → Rp55.000', () => {
  assert.equal(calculateFee({ dayType: 'weekday', overtimeType: 'pagi_malam', startTime: '06:30', durationMinutes: 240 }), 55000)
})
test('weekday pagi 07.30 + malam → Rp35.000 (pagi tidak dapat fee)', () => {
  assert.equal(calculateFee({ dayType: 'weekday', overtimeType: 'pagi_malam', startTime: '07:30', durationMinutes: 240 }), 35000)
})

// ── Overnight: selalu menggantikan, tidak di-stack ─────────────────────
test('weekday overnight → Rp50.000', () => {
  assert.equal(calculateFee({ dayType: 'weekday', overtimeType: 'overnight', startTime: '22:00', durationMinutes: 480 }), FEE.WEEKDAY_OVERNIGHT)
})
test('weekend overnight → Rp100.000', () => {
  assert.equal(calculateFee({ dayType: 'weekend', overtimeType: 'weekend_overnight', startTime: '20:00', durationMinutes: 600 }), FEE.WEEKEND_OVERNIGHT)
})

// ── Weekend: batas 239 / 240 / 241 menit ───────────────────────────────
test('weekend 239 menit → Rp40.000', () => {
  assert.equal(calculateFee({ dayType: 'weekend', overtimeType: 'weekend_halfday', startTime: '09:00', durationMinutes: 239 }), FEE.WEEKEND_HALFDAY)
})
test('weekend tepat 240 menit → Rp80.000', () => {
  assert.equal(calculateFee({ dayType: 'weekend', overtimeType: 'weekend_fullday', startTime: '09:00', durationMinutes: 240 }), FEE.WEEKEND_FULLDAY)
})
test('weekend 241 menit → Rp80.000', () => {
  assert.equal(calculateFee({ dayType: 'weekend', overtimeType: 'weekend_fullday', startTime: '09:00', durationMinutes: 241 }), FEE.WEEKEND_FULLDAY)
})
test('weekend 5 jam → Rp80.000', () => {
  assert.equal(calculateFee({ dayType: 'weekend', overtimeType: 'weekend_fullday', startTime: '09:00', durationMinutes: 300 }), FEE.WEEKEND_FULLDAY)
})

// ── Fallback aman ───────────────────────────────────────────────────────
test('input kosong tidak crash, fee 0', () => {
  assert.equal(calculateFee({}), 0)
})
