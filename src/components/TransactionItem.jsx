const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function TransactionItem({ transaction }) {
  const isIncome = transaction.type === 'income'

  return (
    <li className="transaction-item">
      <span
        className={`transaction-item__icon ${isIncome ? 'transaction-item__icon--income' : 'transaction-item__icon--expense'}`}
        aria-hidden="true"
      >
        {isIncome ? '↙' : '↗'}
      </span>
      <div className="transaction-item__details">
        <p className="transaction-item__title">{transaction.title}</p>
        <p className="transaction-item__meta">
          {transaction.category} <span aria-hidden="true">·</span>{' '}
          {dateFormatter.format(new Date(`${transaction.date}T00:00:00Z`))}
        </p>
      </div>
      <p
        className={`transaction-item__amount ${isIncome ? 'transaction-item__amount--income' : ''}`}
      >
        {isIncome ? '+' : '-'} {rupiahFormatter.format(transaction.amount)}
      </p>
    </li>
  )
}

export default TransactionItem
