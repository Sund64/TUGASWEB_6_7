import 'dotenv/config'
import express from 'express'
import { HttpError } from './server/errors/HttpError.js'
import { PrismaService } from './server/providers/PrismaService.js'
import { AuthService } from './server/services/AuthService.js'
import { TransactionService } from './server/services/TransactionService.js'

const app = express()
const port = Number(process.env.PORT || 3001)
const prismaService = new PrismaService()
const authService = new AuthService(prismaService)
const transactionService = new TransactionService(prismaService)

app.use(express.json({ limit: '32kb' }))

function getToken(req) {
  const authorization = req.headers.authorization
  return authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
}

async function requireUser(req, res, next) {
  try {
    req.userId = await authService.authenticate(getToken(req))
    next()
  } catch (error) {
    next(error)
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: 'PostgreSQL lokal via Prisma' })
})

app.post('/api/auth/register', async (req, res) => {
  const account = await authService.register(req.body?.username, req.body?.password)
  res.status(201).json(account)
})

app.post('/api/auth/login', async (req, res) => {
  const account = await authService.login(req.body?.username, req.body?.password)
  res.json(account)
})

app.post('/api/auth/logout', requireUser, async (req, res) => {
  await authService.logout(getToken(req))
  res.status(204).end()
})

app.get('/api/transactions', requireUser, async (req, res) => {
  res.json(await transactionService.list(req.userId, req.query))
})

app.post('/api/transactions', requireUser, async (req, res) => {
  const transaction = await transactionService.create(req.userId, req.body || {})
  res.status(201).json(transaction)
})

app.patch('/api/transactions/:id', requireUser, async (req, res) => {
  const transaction = await transactionService.update(
    req.userId,
    req.params.id,
    req.body || {},
  )
  res.json(transaction)
})

app.delete('/api/transactions/:id', requireUser, async (req, res) => {
  await transactionService.delete(req.userId, req.params.id)
  res.status(204).end()
})

app.use((error, _req, res, _next) => {
  console.error(error)
  if (res.headersSent) return
  const status = error instanceof HttpError ? error.status : 500
  const message = status === 500
    ? 'Terjadi kesalahan pada server.'
    : error.message
  res.status(status).json({ message })
})

async function startServer() {
  await prismaService.onModuleInit()
  const server = app.listen(port, '127.0.0.1', () => {
    console.log(`REST API berjalan di http://localhost:${port}`)
  })

  const shutdown = async () => {
    server.close(async () => {
      await prismaService.onModuleDestroy()
      process.exit(0)
    })
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}

startServer().catch(async (error) => {
  console.error('Gagal menghubungkan REST API ke PostgreSQL lokal:', error.message)
  await prismaService.onModuleDestroy()
  process.exitCode = 1
})
