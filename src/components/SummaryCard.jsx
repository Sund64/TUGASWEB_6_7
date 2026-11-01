const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

function SummaryCard({ title, amount, description, variant, icon }) {
  return (
    <article className={`summary-card summary-card--${variant}`}>
      <div className="summary-card__top">
        <span className="summary-card__title">{title}</span>
        <span className="summary-card__icon" aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className="summary-card__amount">{rupiahFormatter.format(amount)}</p>
      <p className="summary-card__description">{description}</p>
    </article>
  )
}

export default SummaryCard
