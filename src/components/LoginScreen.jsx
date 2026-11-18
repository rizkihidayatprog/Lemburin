import { useState } from 'react'
import { Clock3, Eye, EyeOff, Mail, Lock, LogIn, AlertCircle, Loader2, Send, ArrowLeft } from 'lucide-react'
import { signIn, signUp, resetPassword, friendlyAuthError, JUSTITIA_PATTERN } from '../services/authService'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetInfo, setResetInfo] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('Email dan password wajib diisi.')
      return
    }
    setLoading(true)
    try {
      // 1) Coba login dulu
      await signIn(trimmedEmail, password)
    } catch (err) {
      const code = err?.code || ''
      const isCredentialError = code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password'
      // 2) Jika gagal kredensial & email pola 'justitia' → daftar otomatis (login pertama)
      if (isCredentialError && JUSTITIA_PATTERN.test(trimmedEmail)) {
        try {
          await signUp(trimmedEmail, password)
          // Akun baru terdaftar, langsung masuk
        } catch (signUpErr) {
          setError(
            signUpErr?.code === 'auth/email-already-in-use'
              ? 'Email atau password salah.'
              : friendlyAuthError(signUpErr),
          )
        }
      } else {
        setError(friendlyAuthError(err))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setResetInfo('')
    if (!email.trim()) {
      setError('Isi email Anda dulu.')
      return
    }
    setLoading(true)
    try {
      await resetPassword(email)
      setResetInfo('Tautan reset password dikirim ke email Anda. Cek inbox (dan folder spam).')
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fffdf8] px-4 py-10">
      {/* Aksen lembut di latar */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(700px 400px at 50% -10%, rgba(250,204,21,0.25), transparent 60%), radial-gradient(600px 400px at 50% 115%, rgba(206,17,38,0.12), transparent 55%)' }} />

      <div className="animate-modal-in relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indonesia">
            <Clock3 size={30} strokeWidth={2.2} className="text-gold-400" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-brand-950">Overtime <span className="text-indonesia">Management</span></h1>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-brand-800/55">Rekap Fee Lembur</p>
        </div>

        {/* Kartu login */}
        <div className="card mt-6 p-6">
          <h2 className="text-base font-bold text-brand-950">{resetMode ? 'Reset Password' : 'Masuk'}</h2>
          <p className="mt-0.5 text-[11px] text-brand-900/55">
            {resetMode ? 'Kami kirim tautan reset ke email Anda' : 'Email kantor (justitia) terdaftar otomatis'}
          </p>

          {/* Pesan sukses reset */}
          {resetInfo && (
            <div role="status" className="mt-4 rounded-lg border border-emerald-600/30 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
              {resetInfo}
            </div>
          )}

          {/* Pesan error */}
          {error && (
            <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-brand-600/40 bg-brand-50 px-3.5 py-2.5 text-xs font-medium text-brand-800">
              <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={resetMode ? handleReset : handleSubmit} className="mt-4 space-y-3.5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-800/40" aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="nama@email.com"
                  className="input !pl-9"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                />
              </div>
            </div>

            {/* Password (disembunyikan saat mode reset) */}
            {!resetMode && (
              <div>
                <label htmlFor="login-password" className="label">Password</label>
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-800/40" aria-hidden="true" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="input !pl-9 !pr-11"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-brand-800/50 transition hover:text-brand-950"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="btn-primary w-full !py-3" disabled={loading}>
              {loading ? (
                <Loader2 size={17} className="animate-spin" aria-hidden="true" />
              ) : resetMode ? (
                <Send size={16} aria-hidden="true" />
              ) : (
                <LogIn size={17} aria-hidden="true" />
              )}
              {loading ? 'Memproses…' : resetMode ? 'Kirim Tautan Reset' : 'Masuk'}
            </button>
          </form>

          {/* Toggle reset */}
          <div className="mt-3 text-center">
            {resetMode ? (
              <button type="button" onClick={() => { setResetMode(false); setError(''); setResetInfo('') }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-800/70 transition hover:text-indonesia">
                <ArrowLeft size={13} aria-hidden="true" />
                Kembali ke halaman masuk
              </button>
            ) : (
              <button type="button" onClick={() => { setResetMode(true); setError(''); setResetInfo('') }} className="text-xs font-semibold text-brand-800/70 transition hover:text-indonesia">
                Lupa password?
              </button>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] leading-relaxed text-brand-800/50">
          Email bertag <em>justitia</em> (mis. nama.justitia@gmail.com) terdaftar otomatis<br />saat pertama kali login. Hubungi admin untuk akun lain.
        </p>
      </div>
    </div>
  )
}
