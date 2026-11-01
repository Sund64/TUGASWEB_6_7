import { useState } from 'react'
import Header from './components/Header.jsx'
import SummaryCard from './components/SummaryCard.jsx'
import TransactionForm from './components/TransactionForm.jsx'
import TransactionList from './components/TransactionList.jsx'
import './App.css'

const initialTransactions = [
  {
    id: 'transaction-1',
    title: 'Gaji bulanan',
    category: 'Gaji',
    type: 'income',
    amount: 8500000,
    date: '2026-10-25',
  },
  {
    id: 'transaction-2',
    title: 'Belanja kebutuhan rumah',
    category: 'Belanja',
    type: 'expense',
    amount: 675000,
    date: '2026-10-27',
  },
  {
    id: 'transaction-3',
    title: 'Tagihan internet',
    category: 'Tagihan',
    type: 'expense',
    amount: 350000,
    date: '2026-10-28',
  },
  {
    id: 'transaction-4',
    title: 'Freelance desain poster',
    category: 'Pekerjaan sampingan',
    type: 'income',
    amount: 750000,
    date: '2026-10-30',
  },
]

function App() {
  const [transactions, setTransactions] = useState(initialTransactions)

  const income = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0)

  const expenses = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0)

  const balance = income - expenses

  function addTransaction(transaction) {
    setTransactions((currentTransactions) => [
      {
        ...transaction,
        id: crypto.randomUUID(),
      },
      ...currentTransactions,
    ])
  }

  return (
    <main className="app-shell">
      <Header />

      <section className="summary-grid" aria-label="Ringkasan keuangan">
        <SummaryCard
          title="Total saldo"
          amount={balance}
          description="Sisa uang dari pemasukan dan pengeluaran"
          variant="balance"
          icon="◈"
        />
        <SummaryCard
          title="Total pemasukan"
          amount={income}
          description="Uang yang masuk"
          variant="income"
          icon="↙"
        />
        <SummaryCard
          title="Total pengeluaran"
          amount={expenses}
          description="Uang yang sudah digunakan"
          variant="expense"
          icon="↗"
        />
      </section>

      <section className="content-grid">
        <TransactionForm onAddTransaction={addTransaction} />
        <TransactionList transactions={transactions} />
      </section>

    </main>
  )
}

export default App
