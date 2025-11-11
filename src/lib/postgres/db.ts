import { PrismaClient } from '@/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = 'postgresql://postgres:pass1234@192.168.1.80:5432/limesurveydb'

const adapter = new PrismaPg({ connectionString })

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    adapter,
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma
}
