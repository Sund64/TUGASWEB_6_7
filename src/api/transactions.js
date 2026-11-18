const transactionColumns =
  'id, title, category, type, amount, original_amount, currency, exchange_rate, date, created_at'

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

export async function fetchTransactions(client, userId) {
  const { data, error } = await client
    .from('transactions')
    .select(transactionColumns)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data.map(mapTransaction)
}

export async function createTransaction(client, userId, transaction) {
  const { data, error } = await client
    .from('transactions')
    .insert({
      user_id: userId,
      title: transaction.title,
      category: transaction.category,
      type: transaction.type,
      amount: transaction.amount,
      original_amount: transaction.originalAmount,
      currency: transaction.currency,
      exchange_rate: transaction.exchangeRate,
      date: transaction.date,
    })
    .select(transactionColumns)
    .single()

  if (error) {
    throw error
  }

  return mapTransaction(data)
}
