import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Database helper functions
export async function getBillsByState(stateCode: string) {
  return prisma.bill.findMany({
    where: {
      state: {
        code: stateCode.toUpperCase()
      }
    },
    include: {
      summaries: {
        where: {
          type: 'BRIEF'
        },
        take: 1
      },
      state: true
    },
    orderBy: {
      lastActionDate: 'desc'
    }
  })
}

export async function getBillById(id: string) {
  return prisma.bill.findUnique({
    where: { id },
    include: {
      summaries: true,
      state: true
    }
  })
}

export async function createBill(data: {
  title: string
  billNumber: string
  status: string
  stateId: string
  fullText?: string
  introducedDate?: Date
  lastActionDate?: Date
  lastAction?: string
  sponsor?: string
  sourceUrl?: string
}) {
  return prisma.bill.create({
    data: {
      ...data,
      scrapedAt: new Date()
    }
  })
}

export async function createSummary(data: {
  content: string
  billId: string
  type?: 'BRIEF' | 'DETAILED' | 'KEY_POINTS' | 'IMPACT_ANALYSIS'
  keyPoints?: string[]
  impact?: string
  aiModel?: string
  confidence?: number
}) {
  return prisma.summary.create({
    data
  })
}

export async function getOrCreateState(name: string, code: string) {
  return prisma.state.upsert({
    where: { code: code.toUpperCase() },
    update: {},
    create: {
      name,
      code: code.toUpperCase()
    }
  })
}

export async function createScrapingJob(state: string) {
  return prisma.scrapingJob.create({
    data: {
      state: state.toUpperCase(),
      status: 'PENDING'
    }
  })
}

export async function updateScrapingJob(
  id: string,
  data: {
    status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
    billsFound?: number
    billsProcessed?: number
    errors?: string[]
    startedAt?: Date
    completedAt?: Date
  }
) {
  return prisma.scrapingJob.update({
    where: { id },
    data
  })
}

export async function getRecentScrapingJobs(limit = 10) {
  return prisma.scrapingJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}

export async function getBillStats() {
  const [totalBills, byState, byStatus] = await Promise.all([
    prisma.bill.count(),
    prisma.bill.groupBy({
      by: ['stateId'],
      _count: true,
      include: {
        state: true
      }
    }),
    prisma.bill.groupBy({
      by: ['status'],
      _count: true
    })
  ])

  return {
    totalBills,
    byState,
    byStatus
  }
}