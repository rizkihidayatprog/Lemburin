// ============================================================
// Service akses data lembur.
// - Jika VITE_FIREBASE_* dikonfigurasi → Firebase Firestore (realtime onSnapshot)
// - Jika belum → fallback localStorage (mode lokal)
// Firebase SDK dimuat secara dinamis agar tidak membebani bundle awal.
//
// ALUR REKAP & ACC:
//   1. Semua data baru masuk dengan acc = false (rekap aktif)
//   2. Tombol "ACC Rekap Ini" mengunci semua data pending → acc = true,
//      diberi batchId + batchLabel + accAt
//   3. Data ACC masuk ke Riwayat Rekap; rekap aktif mulai dari nol
//   4. Data ACC yang lebih dari 3 bulan dihapus otomatis (purgeAccOlderThanDays)
// ============================================================
import { isFirebaseConfigured } from '../lib/firebaseConfig'
import { periodeFromRecords } from '../utils/dateUtils'

const COLLECTION = 'overtime'
const LOCAL_KEY = 'overtime-management-data-v1'
const LOCAL_EVENT = 'overtime-management-local-update'

export const usingFirebase = isFirebaseConfigured

// Muat Firebase SDK sekali, dipakai semua operasi
let firestorePromise = null
function loadFirestore() {
  if (!firestorePromise) {
    firestorePromise = Promise.all([import('firebase/firestore'), import('../lib/firebase')])
      .then(([fs, fb]) => ({ fs, db: fb.db }))
      .catch((error) => {
        firestorePromise = null
        throw error
      })
  }
  return firestorePromise
}

// ── Helper localStorage ─────────────────────────────────────────────────
function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocal(rows) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows))
  window.dispatchEvent(new CustomEvent(LOCAL_EVENT))
}

function normalizeRow(row) {
  return { ...row, acc: Boolean(row?.acc) }
}

function sortByDateDesc(rows) {
  return [...rows].sort((a, b) => {
    if (a.date === b.date) return String(b.startTime).localeCompare(String(a.startTime))
    return String(b.date).localeCompare(String(a.date))
  })
}

// ── Subscribe (realtime) ────────────────────────────────────────────────
export function subscribeOvertime(onData, onError) {
  if (usingFirebase) {
    let unsubscribe = null
    let cancelled = false

    loadFirestore()
      .then(({ fs, db }) => {
        if (cancelled) return
        const q = fs.query(fs.collection(db, COLLECTION), fs.orderBy('date', 'desc'))
        unsubscribe = fs.onSnapshot(
          q,
          (snapshot) => {
            const rows = snapshot.docs.map((d) => normalizeRow({ id: d.id, ...d.data() }))
            onData(sortByDateDesc(rows))
          },
          (error) => {
            console.error('Firestore listener error:', error)
            onError?.(error)
          },
        )
      })
      .catch((error) => {
        console.error('Gagal memuat Firebase SDK:', error)
        onError?.(error)
      })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }

  const emit = () => onData(sortByDateDesc(readLocal().map(normalizeRow)))
  emit()
  const handler = () => emit()
  window.addEventListener(LOCAL_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(LOCAL_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

// ── CRUD ────────────────────────────────────────────────────────────────
export async function addOvertime(record) {
  const payload = { ...record, acc: false }
  if (usingFirebase) {
    const { fs, db } = await loadFirestore()
    return fs.addDoc(fs.collection(db, COLLECTION), {
      ...payload,
      createdAt: fs.serverTimestamp(),
      updatedAt: fs.serverTimestamp(),
    })
  }
  const rows = readLocal()
  const id = crypto.randomUUID()
  rows.push({ ...payload, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  writeLocal(rows)
  return { id }
}

export async function updateOvertime(id, record) {
  // acc/batch tidak boleh diubah lewat edit biasa
  const { acc, accAt, batchId, batchLabel, batchStart, batchEnd, ...safeRecord } = record
  const payload = { ...safeRecord }
  if (usingFirebase) {
    const { fs, db } = await loadFirestore()
    return fs.updateDoc(fs.doc(db, COLLECTION, id), { ...payload, updatedAt: fs.serverTimestamp() })
  }
  const rows = readLocal().map((row) =>
    row.id === id ? { ...row, ...payload, updatedAt: new Date().toISOString() } : row,
  )
  writeLocal(rows)
  return { id }
}

export async function deleteOvertime(id) {
  if (usingFirebase) {
    const { fs, db } = await loadFirestore()
    return fs.deleteDoc(fs.doc(db, COLLECTION, id))
  }
  writeLocal(readLocal().filter((row) => row.id !== id))
  return { id }
}

/** Hapus banyak record sekaligus (dipakai hapus batch ACC & purge 3 bulan) */
export async function deleteOvertimeMany(ids) {
  const list = [...new Set(ids)].filter(Boolean)
  if (!list.length) return { deleted: 0 }
  if (usingFirebase) {
    const { fs, db } = await loadFirestore()
    // writeBatch maksimal 500 operasi — dipecah per 400
    for (let i = 0; i < list.length; i += 400) {
      const chunk = list.slice(i, i + 400)
      const batch = fs.writeBatch(db)
      for (const id of chunk) {
        batch.delete(fs.doc(db, COLLECTION, id))
      }
      await batch.commit()
    }
    return { deleted: list.length }
  }
  const idSet = new Set(list)
  writeLocal(readLocal().filter((row) => !idSet.has(row.id)))
  return { deleted: list.length }
}

// ── ACC: kunci semua data yang belum di-ACC ─────────────────────────────
export async function accAllPending() {
  if (usingFirebase) {
    const { fs, db } = await loadFirestore()
    // Ambil snapshot terbaru agar label periode akurat
    const snapshot = await fs.getDocs(fs.query(fs.collection(db, COLLECTION)))
    const rows = snapshot.docs.map((d) => normalizeRow({ id: d.id, ...d.data() }))
    const pending = rows.filter((row) => !row.acc)
    if (!pending.length) return null

    const periode = periodeFromRecords(pending)
    const batchId = crypto.randomUUID()
    const accAt = new Date().toISOString()
    const stamp = { acc: true, accAt, batchId, batchLabel: periode.label, batchStart: periode.min, batchEnd: periode.max }

    for (let i = 0; i < pending.length; i += 400) {
      const chunk = pending.slice(i, i + 400)
      const batch = fs.writeBatch(db)
      for (const row of chunk) {
        batch.update(fs.doc(db, COLLECTION, row.id), { ...stamp, updatedAt: fs.serverTimestamp() })
      }
      await batch.commit()
    }
    return { ...accSummary(pending, periode, accAt, batchId) }
  }

  const rows = readLocal().map(normalizeRow)
  const pending = rows.filter((row) => !row.acc)
  if (!pending.length) return null

  const periode = periodeFromRecords(pending)
  const batchId = crypto.randomUUID()
  const accAt = new Date().toISOString()
  const stamp = { acc: true, accAt, batchId, batchLabel: periode.label, batchStart: periode.min, batchEnd: periode.max }

  const stamped = rows.map((row) =>
    row.acc ? row : { ...row, ...stamp, updatedAt: accAt },
  )
  writeLocal(stamped)
  return { ...accSummary(pending, periode, accAt, batchId) }
}

function accSummary(pending, periode, accAt, batchId) {
  return {
    batchId,
    accAt,
    label: periode.label,
    rangeLabel: periode.rangeLabel,
    count: pending.length,
    fee: pending.reduce((s, r) => s + (Number(r.fee) || 0), 0),
    minutes: pending.reduce((s, r) => s + (Number(r.durationMinutes) || 0), 0),
  }
}

/** Hapus otomatis data ACC yang lebih tua dari `days` hari (default 92 ≈ 3 bulan) */
export async function purgeAccOlderThanDays(days = 92) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const isOld = (row) => {
    if (!row.acc) return false
    const t = row.accAt || row.batchEnd || row.updatedAt || null
    return Boolean(t) && t < cutoff
  }

  if (usingFirebase) {
    const { fs, db } = await loadFirestore()
    const snapshot = await fs.getDocs(fs.collection(db, COLLECTION))
    const oldIds = snapshot.docs
      .map((d) => normalizeRow({ id: d.id, ...d.data() }))
      .filter(isOld)
      .map((row) => row.id)
    if (!oldIds.length) return { deleted: 0 }
    return deleteOvertimeMany(oldIds)
  }

  const rows = readLocal().map(normalizeRow)
  const oldIds = rows.filter(isOld).map((row) => row.id)
  if (!oldIds.length) return { deleted: 0 }
  return deleteOvertimeMany(oldIds)
}
