import { HttpError } from '../errors/HttpError.js'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const datePattern = /^\d{4}-\d{2}-\d{2}$/

function parseDate(value, label) {
  if (typeof value !== 'string' || !datePattern.test(value)) {
    throw new HttpError(400, `${label} harus menggunakan format YYYY-MM-DD.`)
  }
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new HttpError(400, `${label} tidak valid.`)
  }
  return parsed
}

function mapTransaction(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    type: row.type,
    amount: Number(row.amount),
    originalAmount: Number(row.originalAmount),
    currency: row.currency,
    exchangeRate: Number(row.exchangeRate),
    date: row.date.toISOString().slice(0, 10),
  }
}

function validateFields(input, partial = false) {
  const data = {}
  const has = (key) => Object.hasOwn(input, key)

  if (!partial || has('title')) {
    const title = String(input.title || '').trim()
    if (!title || title.length > 60) throw new HttpError(400, 'Nama transaksi wajib diisi (maksimal 60 karakter).')
    data.title = title
  }
  if (!partial || has('category')) {
    const category = String(input.category || '').trim()
    if (!category || category.length > 40) throw new HttpError(400, 'Kategori wajib diisi (maksimal 40 karakter).')
    data.category = category
  }
  if (!partial || has('type')) {
    if (!['income', 'expense'].includes(input.type)) {
      throw new HttpError(400, 'Jenis transaksi tidak valid.')
    }
    data.type = input.type
  }
  if (!partial || has('amount')) {
    const amount = Number(input.amount)
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new HttpError(400, 'Nominal transaksi harus bilangan bulat positif.')
    }
    data.amount = BigInt(amount)
  }
  if (!partial || has('originalAmount')) {
    const originalAmount = Number(input.originalAmount)
    if (!Number.isFinite(originalAmount) || originalAmount <= 0) {
      throw new HttpError(400, 'Nominal asal transaksi tidak valid.')
    }
    data.originalAmount = originalAmount
  }
  if (!partial || has('currency')) {
    const currency = String(input.currency || '').trim().toUpperCase()
    if (!/^[A-Z]{3}$/.test(currency)) throw new HttpError(400, 'Kode mata uang tidak valid.')
    data.currency = currency
  }
  if (!partial || has('exchangeRate')) {
    const exchangeRate = Number(input.exchangeRate)
    if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      throw new HttpError(400, 'Kurs mata uang tidak valid.')
    }
    data.exchangeRate = exchangeRate
  }
  if (!partial || has('date')) {
    data.date = parseDate(input.date, 'Tanggal transaksi')
  }

  return data
}

function queryString(value, label) {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || value.length > 100) {
    throw new HttpError(400, `Filter ${label} tidak valid.`)
  }
  return value.trim()
}

function buildFilters(query, userId) {
  const where = { userId }
  const type = queryString(query.type, 'type')
  if (type !== undefined) {
    if (!['income', 'expense'].includes(type)) {
      throw new HttpError(400, 'Filter type harus income atau expense.')
    }
    where.type = type
  }

  const category = queryString(query.category, 'category')
  if (category) where.category = { contains: category, mode: 'insensitive' }

  const search = queryString(query.search, 'search')
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (query.from !== undefined || query.to !== undefined) {
    where.date = {}
    if (query.from !== undefined) {
      where.date.gte = parseDate(query.from, 'Filter from')
    }
    if (query.to !== undefined) {
      const endDate = parseDate(query.to, 'Filter to')
      endDate.setUTCHours(23, 59, 59, 999)
      where.date.lte = endDate
    }
    if (where.date.gte && where.date.lte && where.date.gte > where.date.lte) {
      throw new HttpError(400, 'Filter from tidak boleh setelah filter to.')
    }
  }

  const limit = query.limit === undefined ? 100 : Number(query.limit)
  const offset = query.offset === undefined ? 0 : Number(query.offset)
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
    throw new HttpError(400, 'Limit harus bilangan bulat dari 1 sampai 500.')
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw new HttpError(400, 'Offset harus bilangan bulat minimal 0.')
  }

  return { where, limit, offset }
}

export class TransactionService {
  constructor(prismaService) {
    this.prisma = prismaService
  }

  async list(userId, query) {
    const { where, limit, offset } = buildFilters(query, userId)
    const [rows, count] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: offset,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ])
    return { transactions: rows.map(mapTransaction), count }
  }

  async create(userId, input) {
    const transaction = await this.prisma.transaction.create({
      data: { ...validateFields(input), userId },
    })
    return mapTransaction(transaction)
  }

  async update(userId, id, input) {
    if (!uuidPattern.test(id)) throw new HttpError(400, 'ID transaksi tidak valid.')
    const existing = await this.prisma.transaction.findFirst({
      where: { id, userId },
    })
    if (!existing) throw new HttpError(404, 'Transaksi tidak ditemukan.')

    const data = validateFields(input, true)
    if (Object.keys(data).length === 0) {
      throw new HttpError(400, 'Tidak ada data transaksi untuk diperbarui.')
    }
    const updated = await this.prisma.transaction.update({
      where: { id },
      data,
    })
    return mapTransaction(updated)
  }

  async delete(userId, id) {
    if (!uuidPattern.test(id)) throw new HttpError(400, 'ID transaksi tidak valid.')
    const result = await this.prisma.transaction.deleteMany({
      where: { id, userId },
    })
    if (result.count === 0) throw new HttpError(404, 'Transaksi tidak ditemukan.')
  }
}
