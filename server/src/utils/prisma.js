import 'dotenv/config'

const databaseProvider = process.env.DATABASE_PROVIDER || 'sqlite'
if (!['sqlite', 'postgresql'].includes(databaseProvider)) {
  throw new Error('DATABASE_PROVIDER must be either "sqlite" or "postgresql".')
}

const clientModule = databaseProvider === 'postgresql'
  ? await import('../generated/postgresql/index.js')
  : await import('@prisma/client')
const globalForPrisma = globalThis
const PrismaClient = clientModule.PrismaClient
export const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
