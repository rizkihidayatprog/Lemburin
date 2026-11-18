// Autentikasi email + password (Firebase Auth)
// - Jika Firebase dikonfigurasi → wajib login
// - Jika belum (mode lokal)      → tidak pakai login (fallback)
// Akun TIDAK bisa dibuat dari UI — dibuat oleh pemilik lewat Firebase Console.
import { isFirebaseConfigured } from '../lib/firebaseConfig'

export const authEnabled = isFirebaseConfigured

let authPromise = null
function loadAuth() {
  if (!authPromise) {
    authPromise = Promise.all([import('firebase/auth'), import('../lib/firebase')])
      .then(([fa, fb]) => ({ fa, auth: fb.auth }))
      .catch((error) => {
        authPromise = null
        throw error
      })
  }
  return authPromise
}

/**
 * Subscribe status auth.
 * onState dipanggil dengan:
 *   { status: 'loading' }                       → sedang cek
 *   { status: 'local' }                          → mode lokal (tanpa Firebase, tidak pakai login)
 *   { status: 'out' }                            → belum login
 *   { status: 'in', user: { email, uid } }       → sudah login
 */
export function subscribeAuth(onState) {
  onState({ status: 'loading' })

  if (!authEnabled) {
    const t = window.setTimeout(() => onState({ status: 'local' }), 0)
    return () => window.clearTimeout(t)
  }

  let cancelled = false
  let unsubscribe = null

  loadAuth()
    .then(({ fa, auth }) => {
      if (cancelled) return
      unsubscribe = fa.onAuthStateChanged(auth, (user) => {
        if (user) {
          onState({ status: 'in', user: { email: user.email, uid: user.uid } })
        } else {
          onState({ status: 'out' })
        }
      })
    })
    .catch((error) => {
      console.error('Gagal memuat Firebase Auth:', error)
      if (!cancelled) onState({ status: 'out', error: error?.message })
    })

  return () => {
    cancelled = true
    unsubscribe?.()
  }
}

/** Login — melempar object { code } gaya Firebase bila gagal */
export async function signIn(email, password) {
  const { fa, auth } = await loadAuth()
  return fa.signInWithEmailAndPassword(auth, String(email).trim(), password)
}

/** Daftar akun baru — dipakai otomatis saat email subset 'justitia' login pertama kali */
export async function signUp(email, password) {
  const { fa, auth } = await loadAuth()
  return fa.createUserWithEmailAndPassword(auth, String(email).trim(), password)
}

/** Pola email yang boleh terdaftar otomatis (email kantor 'justitia') */
export const JUSTITIA_PATTERN = /justitia/i

export async function signOutUser() {
  const { fa, auth } = await loadAuth()
  return fa.signOut(auth)
}

/** Kirim email reset password */
export async function resetPassword(email) {
  const { fa, auth } = await loadAuth()
  return fa.sendPasswordResetEmail(auth, String(email).trim())
}

/** Petakan kode error Firebase → pesan Bahasa Indonesia */
export function friendlyAuthError(error) {
  const code = error?.code || ''
  switch (code) {
    case 'auth/invalid-email':
      return 'Format email tidak valid.'
    case 'auth/user-not-found':
      return 'Email ini belum terdaftar. Hubungi admin aplikasi.'
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email atau password salah.'
    case 'auth/missing-password':
      return 'Password wajib diisi.'
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Coba lagi beberapa menit lagi.'
    case 'auth/network-request-failed':
      return 'Gagal terhubung ke server. Periksa koneksi internet Anda.'
    case 'auth/user-disabled':
      return 'Akun ini dinonaktifkan.'
    case 'auth/operation-not-allowed':
      return 'Login email/password belum diaktifkan. Aktifkan di Firebase Console → Authentication.'
    case 'auth/weak-password':
      return 'Password minimal 6 karakter (untuk pendaftaran akun baru).'
    case 'auth/email-already-in-use':
      return 'Akun ini sudah terdaftar — periksa kembali password Anda.'
    default:
      return error?.message ? `Login gagal: ${error.message}` : 'Login gagal. Coba lagi.'
  }
}
