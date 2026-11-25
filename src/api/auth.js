async function post(path, body) {
  const response = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Permintaan gagal.')
  return data
}

export function registerAppUser(username, password) {
  return post('/auth/register', { username, password })
}

export function loginAppUser(username, password) {
  return post('/auth/login', { username, password })
}

export async function signOutAppUser(_client, sessionToken) {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessionToken}` },
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    return { error: new Error(data.message || 'Gagal keluar.') }
  }
  return { error: null }
}
