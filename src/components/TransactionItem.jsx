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

function TransactionItem({ transaction, onDelete, onEdit }) {
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
        {transaction.currency && transaction.currency !== 'IDR' && (
          <p className="transaction-item__original">
            {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: transaction.currency,
              maximumFractionDigits: 2,
            }).format(transaction.originalAmount)}
          </p>
        )}
      </div>
      <p
        className={`transaction-item__amount ${isIncome ? 'transaction-item__amount--income' : ''}`}
      >
        {isIncome ? '+' : '-'} {rupiahFormatter.format(transaction.amount)}
      </p>
      {onDelete && (
        <div className="transaction-item__actions">
          {onEdit && (
            <button
              type="button"
              className="transaction-item__edit"
              onClick={() => onEdit(transaction)}
            >
              Edit
            </button>
          )}
          <button
            type="button"
            className="transaction-item__delete"
            onClick={() => onDelete(transaction.id)}
            aria-label={`Hapus ${transaction.title}`}
          >
            Hapus
          </button>
        </div>
      )}
    </li>
  )
}

export default TransactionItem
