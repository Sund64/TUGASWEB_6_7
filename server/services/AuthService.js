import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { HttpError } from '../errors/HttpError.js'

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex')

export class AuthService {
  constructor(prismaService) {
    this.prisma = prismaService
  }

  async register(usernameInput, passwordInput) {
    const username = String(usernameInput || '').trim().toLowerCase()
    const password = String(passwordInput || '')

    if (username.length < 3 || username.length > 50) {
      throw new HttpError(400, 'Username harus terdiri dari 3 sampai 50 karakter.')
    }
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      throw new HttpError(400, 'Kata sandi harus minimal 8 karakter dan maksimal 72 byte.')
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const user = await transaction.appUser.create({
          data: {
            username,
            passwordHash: await bcrypt.hash(password, 12),
          },
        })
        const token = crypto.randomBytes(32).toString('hex')
        await transaction.appSession.create({
          data: {
            tokenHash: hashToken(token),
            userId: user.id,
            expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
          },
        })
        return { token, username: user.username }
      })
    } catch (error) {
      if (error?.code === 'P2002') {
        throw new HttpError(409, 'Username sudah digunakan.')
      }
      throw error
    }
  }

  async login(usernameInput, passwordInput) {
    const username = String(usernameInput || '').trim().toLowerCase()
    const password = String(passwordInput || '')
    const user = await this.prisma.appUser.findUnique({ where: { username } })

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpError(401, 'Username atau kata sandi tidak valid.')
    }

    const token = crypto.randomBytes(32).toString('hex')
    await this.prisma.$transaction([
      this.prisma.appSession.deleteMany({
        where: { userId: user.id, expiresAt: { lte: new Date() } },
      }),
      this.prisma.appSession.create({
        data: {
          tokenHash: hashToken(token),
          userId: user.id,
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        },
      }),
    ])
    return { token, username: user.username }
  }

  async authenticate(token) {
    if (!token) {
      throw new HttpError(401, 'Sesi login tidak valid.')
    }

    const session = await this.prisma.appSession.findUnique({
      where: { tokenHash: hashToken(token) },
    })
    if (!session || session.expiresAt <= new Date()) {
      throw new HttpError(401, 'Sesi login telah berakhir. Silakan masuk kembali.')
    }
    return session.userId
  }

  async logout(token) {
    await this.prisma.appSession.deleteMany({
      where: { tokenHash: hashToken(token) },
    })
  }
}
