// scripts/clean-duplicates.ts
import { config } from 'dotenv'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

interface DuplicateGroup {
  stateId: string
  billNumber: string
  ids: string[]
}

async function cleanDuplicates() {
  console.log('Finding duplicate bills...')
  
  // Get all duplicate bill combinations
  const duplicates = await prisma.$queryRaw<DuplicateGroup[]>`
    SELECT "stateId", "billNumber", array_agg(id ORDER BY "updatedAt" DESC) as ids
    FROM bills 
    GROUP BY "stateId", "billNumber" 
    HAVING COUNT(*) > 1
  `
  
  console.log(`Found ${duplicates.length} sets of duplicates`)
  
  let totalDeleted = 0
  
  for (const duplicate of duplicates) {
    const [keepId, ...deleteIds] = duplicate.ids
    console.log(`Bill ${duplicate.billNumber} in ${duplicate.stateId}: keeping ${keepId}, deleting ${deleteIds.length} duplicates`)
    
    // Delete the older duplicates
    const result = await prisma.bill.deleteMany({
      where: {
        id: { in: deleteIds }
      }
    })
    
    totalDeleted += result.count
  }
  
  console.log(`Cleanup complete! Deleted ${totalDeleted} duplicate bills.`)
  await prisma.$disconnect()
}

cleanDuplicates().catch((error) => {
  console.error('Error cleaning duplicates:', error)
  process.exit(1)
})