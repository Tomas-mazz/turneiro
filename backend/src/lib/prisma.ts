import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function withPrismaPoolingHints(url: string): string {
  // On serverless (e.g. Vercel), many concurrent invocations can exhaust DB connections.
  // These params help Prisma wait a bit longer and keep the pool small per instance.
  try {
    const u = new URL(url)
    if (!u.searchParams.has('connection_limit')) u.searchParams.set('connection_limit', '1')
    if (!u.searchParams.has('pool_timeout')) u.searchParams.set('pool_timeout', '30')
    return u.toString()
  } catch {
    return url
  }
}

const databaseUrl =
  process.env.NODE_ENV === 'production' && process.env.DATABASE_URL
    ? withPrismaPoolingHints(process.env.DATABASE_URL)
    : process.env.DATABASE_URL

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    ...(databaseUrl ? { datasourceUrl: databaseUrl } : {}),
  })

// Reuse Prisma client across hot reloads and serverless invocations when possible.
globalForPrisma.prisma = prisma
