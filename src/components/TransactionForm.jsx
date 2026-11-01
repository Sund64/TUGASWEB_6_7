import { useEffect, useState } from 'react'

const API_URL = 'https://open.er-api.com/v6/latest/IDR'
const currencies = ['IDR', 'USD', 'EUR', 'JPY', 'SGD', 'AUD', 'GBP', 'MYR']
const amountFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
})

function getToday() {
  const today = new Date()
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 10)
}

function TransactionForm({ onAddTransaction }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [type, setType] = useState('expense')
  const [currency, setCurrency] = useState('IDR')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(getToday)
  const [error, setError] = useState('')
  const [rates, setRates] = useState({ IDR: 1 })
  const [rateStatus, setRateStatus] = useState('loading')
  const [rateError, setRateError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchRates() {
      setRateStatus('loading')
      setRateError('')

      try {
        const response = await fetch(API_URL, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`Server mengembalikan status ${response.status}.`)
        }

        const data = await response.json()
        if (data.result !== 'success' || !data.rates) {
          throw new Error('Data kurs mata uang tidak tersedia.')
        }

        const availableRates = Object.fromEntries(
          currencies.map((code) => [code, data.rates[code]]),
        )
        if (
          currencies.some(
            (code) => !Number.isFinite(availableRates[code]) || availableRates[code] <= 0,
          )
        ) {
          throw new Error('Format data kurs mata uang tidak valid.')
        }

        setRates(availableRates)
        setRateStatus('success')
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          return
        }

        setRateError(
          `Kurs mata uang gagal dimuat. Transaksi IDR tetap bisa ditambahkan. (${fetchError.message})`,
        )
        setRateStatus('error')
      }
    }

    fetchRates()
    return () => controller.abort()
  }, [retryCount])

  function handleAmountChange(event) {
    const input = event.currentTarget
    const caretPosition = input.selectionStart ?? input.value.length
    const digitsBeforeCaret = input.value
      .slice(0, caretPosition)
      .replace(/\D/g, '').length
    const nextAmount = input.value.replace(/\D/g, '').slice(0, 15)

    setAmount(nextAmount)

    requestAnimationFrame(() => {
      let nextCaretPosition = 0
      let digitsFound = 0

      while (nextCaretPosition < input.value.length && digitsFound < digitsBeforeCaret) {
        if (/\d/.test(input.value[nextCaretPosition])) {
          digitsFound += 1
        }
        nextCaretPosition += 1
      }

      input.setSelectionRange(nextCaretPosition, nextCaretPosition)
    })
  }

  function handleSubmit(event) {
    event.preventDefault()

    const enteredAmount = Number(amount)
    const rate = rates[currency]
    if (
      !title.trim() ||
      !category.trim() ||
      !Number.isFinite(enteredAmount) ||
      enteredAmount <= 0
    ) {
      setError('Isi semua data dengan benar dan gunakan nominal lebih dari 0.')
      return
    }

    if (!Number.isFinite(rate) || rate <= 0) {
      setError('Kurs untuk mata uang ini belum tersedia. Muat ulang kurs terlebih dahulu.')
      return
    }

    const amountInIdr = Math.round(enteredAmount / rate)
    onAddTransaction({
      title: title.trim(),
      category: category.trim(),
      type,
      amount: amountInIdr,
      originalAmount: enteredAmount,
      currency,
      exchangeRate: rate,
      date,
    })

    setTitle('')
    setCategory('')
    setType('expense')
    setCurrency('IDR')
    setAmount('')
    setDate(getToday())
    setError('')
  }

  const isForeignCurrency = currency !== 'IDR'

  return (
    <section className="panel form-panel" aria-labelledby="form-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">TRANSAKSI BARU</p>
          <h2 id="form-title">Tambah transaksi</h2>
        </div>
        <span className="panel-heading__icon" aria-hidden="true">
          +
        </span>
      </div>

      <form className="transaction-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Nama transaksi</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Contoh: Makan siang"
            maxLength={60}
            required
          />
        </label>

        <label className="form-field">
          <span>Kategori</span>
          <input
            type="text"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Contoh: Makanan"
            maxLength={40}
            required
          />
        </label>

        <div className="form-row">
          <label className="form-field">
            <span>Jenis</span>
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
          </label>

          <label className="form-field">
            <span>Tanggal</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>
        </div>

        <label className="form-field">
          <span>Mata uang transaksi</span>
          <select
            value={currency}
            onChange={(event) => {
              setCurrency(event.target.value)
              setError('')
            }}
          >
            {currencies.map((code) => (
              <option value={code} key={code}>
                {code}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Nominal</span>
          <div className="currency-input">
            <span className="currency-input__prefix" aria-hidden="true">
              {currency}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={amount ? amountFormatter.format(Number(amount)) : ''}
              onChange={handleAmountChange}
              placeholder="0"
              aria-label={`Nominal transaksi dalam ${currency}`}
              required
            />
          </div>
        </label>

        {isForeignCurrency && rateStatus === 'loading' && (
          <p className="form-status" role="status" aria-live="polite">
            Mengambil kurs untuk konversi ke IDR...
          </p>
        )}

        {isForeignCurrency && rateStatus === 'error' && (
          <div className="form-rate-error" role="alert">
            <p>{rateError}</p>
            <button
              className="retry-button"
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
            >
              Coba Lagi
            </button>
          </div>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button
          className="submit-button"
          type="submit"
          disabled={isForeignCurrency && rateStatus !== 'success'}
        >
          <span aria-hidden="true">+</span> Tambah transaksi
        </button>
      </form>
    </section>
  )
}

export default TransactionForm
