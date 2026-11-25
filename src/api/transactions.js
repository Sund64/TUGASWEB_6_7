async function request(path, sessionToken, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${sessionToken}`,
      ...options.headers,
    },
  })
  const data = response.status === 204
    ? {}
    : await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Permintaan transaksi gagal.')
  return data
}

export async function fetchTransactions(_client, sessionToken, filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, value)
  })
  const data = await request(
    `/transactions${params.size ? `?${params.toString()}` : ''}`,
    sessionToken,
  )
  return data.transactions
}

export async function createTransaction(_client, sessionToken, transaction) {
  return request('/transactions', sessionToken, {
    method: 'POST',
    body: JSON.stringify(transaction),
  })
}

export async function updateTransaction(sessionToken, id, changes) {
  return request(`/transactions/${id}`, sessionToken, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  })
}

export async function deleteTransaction(sessionToken, id) {
  await request(`/transactions/${id}`, sessionToken, { method: 'DELETE' })
}
