import { PrismaClient } from '@/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import fs from 'fs'
import path from 'path'

// Load config from config.json
const configPath = path.join(process.cwd(), 'data', 'config.json')
let config: any = {
  databases: {
    limesurvey: {
      connectionString: 'postgresql://limesurvey:1rmE!161@192.168.8.31:5432/limesurveydb'
    },
    secondary: {
      connectionString: 'postgresql://postgres:In9*Xf8;@192.168.8.13:5000/itmsdb'
    }
  }
}

try {
  if (fs.existsSync(configPath)) {
    const configData = fs.readFileSync(configPath, 'utf-8')
    config = JSON.parse(configData)
  }
} catch (error) {
  console.warn('Failed to load config.json, using default database connections:', error)
}

// First database connection (LimeSurvey)
const limesurveyConnectionString = config.databases?.limesurvey?.connectionString || 'postgresql://limesurvey:1rmE!161@192.168.8.31:5432/limesurveydb'
const limesurveyAdapter = new PrismaPg({ connectionString: limesurveyConnectionString })

// Second database connection
const secondaryConnectionString = config.databases?.secondary?.connectionString || 'postgresql://postgres:In9*Xf8;@192.168.8.13:5000/itmsdb'
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
