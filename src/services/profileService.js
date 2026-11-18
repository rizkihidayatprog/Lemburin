// Profil pengguna (nama, divisi, jabatan) — disimpan di browser (localStorage)
const KEY = 'overtime-management-profile-v1'

const EMPTY = { nama: '', divisi: '', jabatan: '' }

export function getProfile() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    const parsed = JSON.parse(raw)
    return {
      nama: String(parsed?.nama || ''),
      divisi: String(parsed?.divisi || ''),
      jabatan: String(parsed?.jabatan || ''),
    }
  } catch {
    return { ...EMPTY }
  }
}

export function saveProfile(profile) {
  const clean = {
    nama: String(profile?.nama || '').trim(),
    divisi: String(profile?.divisi || '').trim(),
    jabatan: String(profile?.jabatan || '').trim(),
  }
  localStorage.setItem(KEY, JSON.stringify(clean))
  return clean
}

export function getInitials(nama) {
  const words = String(nama || '').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return '?'
  return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}
