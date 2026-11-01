import { useState } from 'react'

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
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(getToday)
  const [error, setError] = useState('')

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

    const parsedAmount = Number(amount)
    if (!title.trim() || !category.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Isi semua data dengan benar dan gunakan nominal lebih dari 0.')
      return
    }

    onAddTransaction({
      title: title.trim(),
      category: category.trim(),
      type,
      amount: parsedAmount,
      date,
    })

    setTitle('')
    setCategory('')
    setType('expense')
    setAmount('')
    setDate(getToday())
    setError('')
  }

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
          <span>Nominal</span>
          <div className="currency-input">
            <span className="currency-input__prefix" aria-hidden="true">
              Rp.
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={amount ? amountFormatter.format(Number(amount)) : ''}
              onChange={handleAmountChange}
              placeholder="0"
              aria-label="Nominal transaksi dalam Rupiah"
              required
            />
          </div>
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button className="submit-button" type="submit">
          <span aria-hidden="true">+</span> Tambah transaksi
        </button>
      </form>
    </section>
  )
}

export default TransactionForm
