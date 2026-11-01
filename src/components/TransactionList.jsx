import TransactionItem from './TransactionItem.jsx'

function TransactionList({ transactions }) {
  return (
    <section className="panel list-panel" aria-labelledby="transactions-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">RIWAYAT</p>
          <h2 id="transactions-title">Daftar transaksi</h2>
        </div>
        <span className="transaction-count">
          {transactions.length} transaksi
        </span>
      </div>

      {transactions.length === 0 ? (
        <p className="empty-state">Belum ada data transaksi</p>
      ) : (
        <ul className="transaction-list">
          {transactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))}
        </ul>
      )}
    </section>
  )
}

export default TransactionList
