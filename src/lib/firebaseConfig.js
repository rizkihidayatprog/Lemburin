// Konfigurasi Firebase dari environment variables (Netlify) dengan fallback ke project production.
// Nilai fallback = konfigurasi CLIENT web Firebase — ini bukan rahasia (selalu tertanam di bundle).
// Keamanan data dijaga oleh Firestore Rules / App Check, bukan dengan menyembunyikan konfigurasi ini.

const fromEnv = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const fallback = {
  apiKey: 'AIzaSyCmdC58SCW2HAncRiY1dcQHwZX36fVDk8w',
  authDomain: 'overtime-b7d09.firebaseapp.com',
  projectId: 'overtime-b7d09',
  storageBucket: 'overtime-b7d09.firebasestorage.app',
  messagingSenderId: '22583549179',
  appId: '1:22583549179:web:82f6162b490fdee286a45e',
}

export const firebaseConfig = {
  apiKey: fromEnv.apiKey || fallback.apiKey,
  authDomain: fromEnv.authDomain || fallback.authDomain,
  projectId: fromEnv.projectId || fallback.projectId,
  storageBucket: fromEnv.storageBucket || fallback.storageBucket,
  messagingSenderId: fromEnv.messagingSenderId || fallback.messagingSenderId,
  appId: fromEnv.appId || fallback.appId,
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
)
