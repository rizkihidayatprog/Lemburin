import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { firebaseConfig } from './firebaseConfig'

// Modul ini dimuat secara dinamis (dynamic import) hanya saat Firebase dikonfigurasi,
// sehingga mode lokal tidak ikut mengunduh Firebase SDK.

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
