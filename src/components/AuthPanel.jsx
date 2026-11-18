import { useState } from 'react'

function AuthPanel({ client }) {
  const [mode, setMode] = useState('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus('loading')
    setError('')
    setNotice('')

    try {
      const result =
        mode === 'sign-in'
          ? await client.auth.signInWithPassword({ email, password })
          : await client.auth.signUp({ email, password })

      if (result.error) {
        throw result.error
      }

      if (mode === 'sign-up' && !result.data.session) {
        setNotice('Pendaftaran berhasil. Periksa email untuk mengonfirmasi akun.')
      }
      setStatus('idle')
    } catch (authError) {
      setError(authError.message || 'Autentikasi gagal. Silakan coba lagi.')
      setStatus('idle')
    }
  }

  function toggleMode() {
    setMode((currentMode) => (currentMode === 'sign-in' ? 'sign-up' : 'sign-in'))
    setError('')
    setNotice('')
  }

  const isSigningIn = mode === 'sign-in'

  return (
    <section className="panel auth-panel" aria-labelledby="auth-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">AKUN SUPABASE</p>
          <h2 id="auth-title">{isSigningIn ? 'Masuk ke akun' : 'Buat akun'}</h2>
        </div>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="form-field">
          <span>Kata sandi</span>
          <input
            type="password"
            autoComplete={isSigningIn ? 'current-password' : 'new-password'}
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}
        {notice && <p className="form-status" role="status">{notice}</p>}

        <button className="submit-button" type="submit" disabled={status === 'loading'}>
          {status === 'loading'
            ? 'Memproses...'
            : isSigningIn
              ? 'Masuk'
              : 'Daftar'}
        </button>
      </form>

      <button className="auth-toggle" type="button" onClick={toggleMode}>
        {isSigningIn ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
      </button>
    </section>
  )
}

export default AuthPanel
