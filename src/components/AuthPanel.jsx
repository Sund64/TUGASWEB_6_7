import { useState } from 'react'
import { loginAppUser, registerAppUser } from '../api/auth.js'

function AuthPanel({ onLogin }) {
  const [mode, setMode] = useState('sign-in')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const isSigningUp = mode === 'sign-up'

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus('loading')
    setError('')

    try {
      const result = isSigningUp
        ? await registerAppUser(username.trim(), password)
        : await loginAppUser(username.trim(), password)
      onLogin({ token: result.token, username: result.username })
    } catch (authError) {
      setError(authError.message || 'Autentikasi gagal. Silakan coba lagi.')
    } finally {
      setStatus('idle')
    }
  }

  function toggleMode() {
    setMode((currentMode) => (currentMode === 'sign-in' ? 'sign-up' : 'sign-in'))
    setError('')
  }

  return (
    <section className="panel auth-panel" aria-labelledby="auth-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">AKUN APLIKASI</p>
          <h2 id="auth-title">{isSigningUp ? 'Daftar ke aplikasi' : 'Masuk ke aplikasi'}</h2>
        </div>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Username</span>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            minLength={3}
            maxLength={50}
            required
          />
        </label>
        <label className="form-field">
          <span>Kata sandi</span>
          <input
            type="password"
            autoComplete={isSigningUp ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={isSigningUp ? 8 : undefined}
            maxLength={72}
            required
          />
        </label>

        {isSigningUp && (
          <p className="form-status">
            Kata sandi minimal 8 karakter. Setelah daftar, Anda akan langsung masuk.
          </p>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="submit-button" type="submit" disabled={status === 'loading'}>
          {status === 'loading'
            ? 'Memproses...'
            : isSigningUp
              ? 'Daftar'
              : 'Masuk'}
        </button>
      </form>

      <button
        className="auth-toggle"
        type="button"
        onClick={toggleMode}
        disabled={status === 'loading'}
      >
        {isSigningUp ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
      </button>
    </section>
  )
}

export default AuthPanel
