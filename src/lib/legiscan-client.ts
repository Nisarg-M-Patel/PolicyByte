// src/lib/legiscan-client.ts
import { LegiScanAPI } from './legiscan'

export async function fetchStateData(stateCode: string): Promise<{
  success: boolean
  bills: Array<{
    title: string
    billNumber: string
    status: string
    lastActionDate?: Date
    lastAction?: string
    sponsor?: string
    fullText?: string
    sourceUrl: string
    legiScanId: number
    changeHash: string
  }>
  errors: string[]
  totalFound: number
  queriesUsed: number
  cacheStats: { size: number; hitRate: string }
}> {
  const apiKey = process.env.LEGISCAN_API_KEY
  if (!apiKey) {
    return {
      success: false,
      bills: [],
      errors: ['LEGISCAN_API_KEY environment variable not set'],
      totalFound: 0,
      queriesUsed: 0,
      cacheStats: { size: 0, hitRate: '0%' }
    }
  }

  const api = new LegiScanAPI(apiKey)
  const bills: any[] = []
  const errors: string[] = []

  try {
    console.log(`Starting data fetch for ${stateCode}`)
    
    // Use optimized method that respects caching and change detection
    const result = await api.getUpdatedBills(stateCode.toUpperCase(), 25)
    
    console.log(`Queries used: ${result.queriesUsed}`)
    console.log(`New bills: ${result.newBillsCount}, Updated: ${result.updatedBillsCount}`)

    // Process each bill, with rate limiting and text fetching
    for (const billDetail of result.bills) {
      try {
        let fullText: string | undefined
        
        // Only fetch text for bills that have it and we haven't cached
        if (billDetail.texts && billDetail.texts.length > 0) {
          try {
            const latestText = billDetail.texts[0]
            const textData = await api.getBillText(latestText.doc_id)
            
            // Decode base64 text if present
            if (textData.text) {
              try {
                fullText = atob(textData.text)
              } catch {
                fullText = textData.text // Fallback if not base64
              }
            }
          } catch (textError) {
            console.log(`Could not fetch text for ${billDetail.bill_number}`)
          }
        }

        const primarySponsor = billDetail.sponsors?.find(s => s.role === 'Primary')?.name ||
                             billDetail.sponsors?.[0]?.name

        bills.push({
          title: billDetail.title,
          billNumber: billDetail.bill_number,
          status: getStatusText(billDetail.status),
          lastActionDate: billDetail.last_action_date ? new Date(billDetail.last_action_date) : undefined,
          lastAction: billDetail.last_action,
          sponsor: primarySponsor,
          fullText,
          sourceUrl: billDetail.url,
          legiScanId: billDetail.bill_id,
          changeHash: billDetail.change_hash
        })

        // Be respectful with timing between requests
        await new Promise(resolve => setTimeout(resolve, 150))
        
      } catch (billError) {
        errors.push(`Failed to process bill ${billDetail.bill_number}: ${billError instanceof Error ? billError.message : 'Unknown error'}`)
      }
    }

    return {
      success: true,
      bills,
      errors,
      totalFound: result.bills.length,
      queriesUsed: api.getQueryCount(),
      cacheStats: api.getCacheStats()
    }

  } catch (error) {
    return {
      success: false,
      bills,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      totalFound: 0,
      queriesUsed: api.getQueryCount(),
      cacheStats: api.getCacheStats()
    }
  }
}

function getStatusText(status: number): string {
  const statusMap: Record<number, string> = {
    1: 'Introduced',
    2: 'Engrossed', 
    3: 'Enrolled',
    4: 'Passed',
    5: 'Vetoed',
    6: 'Failed'
  }
  return statusMap[status] || 'Unknown'
}

// Query usage tracking for admin dashboard
export function getMonthlyQueryUsage(): {
  used: number
  limit: number
  percentage: number
  resetDate: string
} {
  // This would be stored in database in production
  // For now, return mock data
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  
  return {
    used: 2500, // Would track actual usage
    limit: 30000,
    percentage: 8.3,
    resetDate: nextMonth.toISOString().split('T')[0]
  }
}