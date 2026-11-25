import { useEffect, useState } from 'react'
import {
  createTransaction,
  deleteTransaction,
  fetchTransactions,
  updateTransaction,
} from './api/transactions.js'
import { signOutAppUser } from './api/auth.js'
import AuthPanel from './components/AuthPanel.jsx'
import Header from './components/Header.jsx'
import SummaryCard from './components/SummaryCard.jsx'
import TransactionForm from './components/TransactionForm.jsx'
import TransactionList from './components/TransactionList.jsx'
import './App.css'

const sessionStorageKey = 'keuangan-app-session'

function App() {
  const [session, setSession] = useState(() => {
    const storedSession = window.sessionStorage.getItem(sessionStorageKey)
    if (!storedSession) {
      return null
    }

    try {
      const parsedSession = JSON.parse(storedSession)
      return parsedSession.token && parsedSession.username ? parsedSession : null
    } catch {
      window.sessionStorage.removeItem(sessionStorageKey)
      return null
    }
  })
  const [authError, setAuthError] = useState('')
  const [transactionData, setTransactionData] = useState(null)
  const [transactionRetryCount, setTransactionRetryCount] = useState(0)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    if (!session) {
      return undefined
    }

    let isActive = true

    fetchTransactions(null, session.token)
      .then((data) => {
        if (isActive) {
          setTransactionData({
            token: session.token,
            retryCount: transactionRetryCount,
            transactions: data,
            status: 'success',
            error: '',
          })
        }
      })
      .catch((error) => {
        if (isActive) {
          setTransactionData({
            token: session.token,
            retryCount: transactionRetryCount,
            transactions: [],
            status: 'error',
            error: error.message || 'Data transaksi gagal dimuat.',
          })
        }
      })

    return () => {
      isActive = false
    }
  }, [session, transactionRetryCount])

  const currentTransactionData =
    transactionData?.token === session?.token &&
    transactionData?.retryCount === transactionRetryCount
      ? transactionData
      : null
  const transactions = currentTransactionData?.transactions ?? []
  const transactionStatus = session ? currentTransactionData?.status ?? 'loading' : 'idle'
  const transactionError = currentTransactionData?.error ?? ''

  const income = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0)

  const expenses = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0)

  const balance = income - expenses

  async function addTransaction(transaction) {
    const savedTransaction = await createTransaction(
      null,
      session.token,
      transaction,
    )
    setTransactionData((currentData) => {
      if (currentData?.token !== session.token) {
        return currentData
      }
      return {
        ...currentData,
        transactions: [savedTransaction, ...currentData.transactions],
      }
    })
  }

  async function removeTransaction(id) {
    await deleteTransaction(session.token, id)
    setTransactionData((currentData) => {
      if (currentData?.token !== session.token) return currentData
      return {
        ...currentData,
        transactions: currentData.transactions.filter((item) => item.id !== id),
      }
    })
  }

  async function editTransaction(transaction) {
    const title = window.prompt('Nama transaksi', transaction.title)
    if (title === null) return
    const category = window.prompt('Kategori', transaction.category)
    if (category === null) return
    const saved = await updateTransaction(session.token, transaction.id, {
      title: title.trim(),
      category: category.trim(),
    })
    setTransactionData((currentData) => {
      if (currentData?.token !== session.token) return currentData
      return {
        ...currentData,
        transactions: currentData.transactions.map((item) =>
          item.id === saved.id ? saved : item,
        ),
      }
    })
  }

  async function signOut() {
    setIsSigningOut(true)
    setAuthError('')
    try {
      const { error } = await signOutAppUser(null, session.token)
      if (error) {
        setAuthError(error.message)
      }
    } catch (error) {
      setAuthError(error.message || 'Gagal keluar dari akun.')
    } finally {
      window.sessionStorage.removeItem(sessionStorageKey)
      setSession(null)
      setTransactionData(null)
      setIsSigningOut(false)
    }
  }

  function handleLogin(nextSession) {
    window.sessionStorage.setItem(sessionStorageKey, JSON.stringify(nextSession))
    setSession(nextSession)
    setAuthError('')
    setTransactionRetryCount(0)
    setTransactionData(null)
  }

  return (
    <main className="app-shell">
      <Header />

      {!session && (
        <AuthPanel onLogin={handleLogin} />
      )}

      {session && (
        <>
          <div className="account-bar">
            <p>Masuk sebagai <strong>{session.username}</strong></p>
            <button
              className="retry-button"
              type="button"
              onClick={signOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? 'Keluar...' : 'Keluar'}
            </button>
          </div>

          {authError && <p className="form-error" role="alert">{authError}</p>}

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
            <TransactionForm
              onAddTransaction={addTransaction}
              disabled={transactionStatus !== 'success'}
            />
            <TransactionList
              transactions={transactions}
              status={transactionStatus}
              error={transactionError}
              onRetry={() => setTransactionRetryCount((count) => count + 1)}
              onDelete={removeTransaction}
              onEdit={editTransaction}
            />
          </section>

        </>
      )}
    </main>
  )
}

export default App
