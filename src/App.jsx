import { useEffect, useState } from 'react'
import { createTransaction, fetchTransactions } from './api/transactions.js'
import AuthPanel from './components/AuthPanel.jsx'
import Header from './components/Header.jsx'
import SummaryCard from './components/SummaryCard.jsx'
import TransactionForm from './components/TransactionForm.jsx'
import TransactionList from './components/TransactionList.jsx'
import StudentsPanel from './components/StudentsPanel.jsx'
import supabase from './lib/supabaseClient.js'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [authStatus, setAuthStatus] = useState(supabase ? 'loading' : 'unconfigured')
  const [authError, setAuthError] = useState('')
  const [authRetryCount, setAuthRetryCount] = useState(0)
  const [transactionData, setTransactionData] = useState(null)
  const [transactionRetryCount, setTransactionRetryCount] = useState(0)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let isActive = true
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthStatus('ready')
      setAuthError('')
    })

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isActive) {
          return
        }

        if (error) {
          throw error
        }

        setSession(data.session)
        setAuthStatus('ready')
      })
      .catch((error) => {
        if (isActive) {
          setAuthError(error.message || 'Sesi akun gagal dimuat.')
          setAuthStatus('error')
        }
      })

    return () => {
      isActive = false
      authListener.subscription.unsubscribe()
    }
  }, [authRetryCount])

  useEffect(() => {
    if (!supabase || !session) {
      return undefined
    }

    let isActive = true

    fetchTransactions(supabase, session.user.id)
      .then((data) => {
        if (isActive) {
          setTransactionData({
            userId: session.user.id,
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
            userId: session.user.id,
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
    transactionData?.userId === session?.user.id &&
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
      supabase,
      session.user.id,
      transaction,
    )
    setTransactionData((currentData) => {
      if (currentData?.userId !== session.user.id) {
        return currentData
      }

      return {
        ...currentData,
        transactions: [savedTransaction, ...currentData.transactions],
      }
    })
  }

  async function signOut() {
    setIsSigningOut(true)
    setAuthError('')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        setAuthError(error.message)
      }
    } catch (error) {
      setAuthError(error.message || 'Gagal keluar dari akun.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <main className="app-shell">
      <Header />

      {!supabase && (
        <p className="config-message" role="alert">
          Konfigurasi Supabase belum tersedia. Isi VITE_SUPABASE_URL dan
          VITE_SUPABASE_PUBLISHABLE_KEY di file .env, lalu jalankan ulang aplikasi.
        </p>
      )}

      {supabase && authStatus === 'loading' && (
        <p className="form-status" role="status">Memeriksa sesi akun...</p>
      )}

      {supabase && authStatus === 'error' && (
        <div className="student-error" role="alert">
          <p>Sesi Supabase gagal dimuat. {authError}</p>
          <button
            className="retry-button"
            type="button"
            onClick={() => {
              setAuthStatus('loading')
              setAuthRetryCount((count) => count + 1)
            }}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {supabase && authStatus === 'ready' && !session && <AuthPanel client={supabase} />}

      {supabase && authStatus === 'ready' && session && (
        <>
          <div className="account-bar">
            <p>Masuk sebagai <strong>{session.user.email}</strong></p>
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
            />
          </section>

          <StudentsPanel
            key={session.user.id}
            client={supabase}
            userId={session.user.id}
          />
        </>
      )}
    </main>
  )
}

export default App
