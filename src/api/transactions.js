function mapTransaction(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    type: row.type,
    amount: Number(row.amount),
    originalAmount: Number(row.original_amount),
    currency: row.currency,
    exchangeRate: Number(row.exchange_rate),
    date: row.date,
  }
}

export async function fetchTransactions(client, sessionToken) {
  const { data, error } = await client.rpc('app_get_transactions', {
    p_session_token: sessionToken,
  })

  if (error) {
    throw error
  }

  return data.map(mapTransaction)
}

export async function createTransaction(client, sessionToken, transaction) {
  const { data, error } = await client.rpc('app_create_transaction', {
    p_session_token: sessionToken,
    p_title: transaction.title,
    p_category: transaction.category,
    p_type: transaction.type,
    p_amount: transaction.amount,
    p_original_amount: transaction.originalAmount,
    p_currency: transaction.currency,
    p_exchange_rate: transaction.exchangeRate,
    p_date: transaction.date,
  })

  if (error) {
    throw error
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) {
    throw new Error('Transaksi tidak dikembalikan oleh Supabase.')
  }
  return mapTransaction(row)
}
