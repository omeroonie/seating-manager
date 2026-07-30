import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Pass the connection string directly — avoids creating an external pg.Pool
// and eliminates the "custom Promise" deprecation warning from pg@8.
function createPrisma() {
  const adapter = new PrismaPg(process.env.DATABASE_URL!)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma