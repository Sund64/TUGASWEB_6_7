import { useState } from 'react'

function AuthPanel({ client, onLogin }) {
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
      const { data, error: authError } = await client.rpc(
        isSigningUp ? 'app_register' : 'app_login',
        {
          p_username: username.trim(),
          p_password: password,
        },
      )
      if (authError) {
        throw authError
      }

      const result = Array.isArray(data) ? data[0] : data
      if (!result?.session_token || !result?.username) {
        throw new Error(
          isSigningUp
            ? 'Pendaftaran gagal. Periksa kembali data akun Anda.'
            : 'Username atau kata sandi tidak valid.',
        )
      }

      onLogin({ token: result.session_token, username: result.username })
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
