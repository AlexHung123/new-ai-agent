import { PrismaClient } from '@/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

// First database connection (LimeSurvey)
const limesurveyConnectionString = 'postgresql://postgres:pass1234@192.168.1.80:5432/limesurveydb'
const limesurveyAdapter = new PrismaPg({ connectionString: limesurveyConnectionString })

// Second database connection
const secondaryConnectionString = 'postgresql://postgres:pass1234@192.168.1.127:5432/itmsdb' // Update with your actual connection string
const secondaryAdapter = new PrismaPg({ connectionString: secondaryConnectionString })

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
  // eslint-disable-next-line no-var
  var __prismaSecondary: PrismaClient | undefined
}

// First database client (LimeSurvey - kept for backward compatibility)
export const prisma =
  global.__prisma ??
  new PrismaClient({
    adapter: limesurveyAdapter,
    log: ['error'],
  })

// Second database client
export const prismaSecondary =
  global.__prismaSecondary ??
  new PrismaClient({
    adapter: secondaryAdapter,
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma
  global.__prismaSecondary = prismaSecondary
}
