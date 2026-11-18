import TransactionItem from './TransactionItem.jsx'

function TransactionList({ transactions, status, error, onRetry }) {
  return (
    <section className="panel list-panel" aria-labelledby="transactions-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">RIWAYAT</p>
          <h2 id="transactions-title">Daftar transaksi</h2>
        </div>
        {status === 'success' && (
          <span className="transaction-count">{transactions.length} transaksi</span>
        )}
      </div>

      {status === 'loading' && (
        <p className="form-status" role="status" aria-live="polite">
          Mengambil transaksi dari Supabase...
        </p>
      )}

      {status === 'error' && (
        <div className="transaction-error" role="alert">
          <p>Transaksi gagal dimuat. {error}</p>
          <button className="retry-button" type="button" onClick={onRetry}>
            Coba Lagi
          </button>
        </div>
      )}

      {status === 'success' && transactions.length === 0 ? (
        <p className="empty-state">Belum ada data transaksi</p>
      ) : status === 'success' ? (
        <ul className="transaction-list">
          {transactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export default TransactionList
