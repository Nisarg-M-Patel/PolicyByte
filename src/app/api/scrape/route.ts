// src/app/api/scrape/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { fetchStateData } from '@/lib/legiscan-client'
import { summarizeBill } from '@/lib/ai'
import { 
  createScrapingJob, 
  updateScrapingJob, 
  getOrCreateState, 
  createBill, 
  createSummary 
} from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { state } = await request.json()
    
    if (!state || typeof state !== 'string') {
      return NextResponse.json(
        { error: 'State code is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.LEGISCAN_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'LegiScan API key not configured' },
        { status: 500 }
      )
    }

    const job = await createScrapingJob(state.toUpperCase())
    
    processStateData(job.id, state.toUpperCase())
    
    return NextResponse.json({
      message: 'Data processing job started',
      jobId: job.id,
      state: state.toUpperCase()
    })
  } catch (error) {
    console.error('Error starting data processing job:', error)
    return NextResponse.json(
      { error: 'Failed to start processing job' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')
  
  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID is required' },
      { status: 400 }
    )
  }

  try {
    return NextResponse.json({
      jobId,
      status: 'RUNNING',
      progress: {
        billsFound: 25,
        billsProcessed: 15,
        billsSummarized: 12
      }
    })
  } catch (error) {
    console.error('Error getting job status:', error)
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    )
  }
}

async function processStateData(jobId: string, stateCode: string) {
  try {
    await updateScrapingJob(jobId, {
      status: 'RUNNING',
      startedAt: new Date()
    })

    const stateNames: Record<string, string> = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
      'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
      'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
      'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
      'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
      'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
      'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
      'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
      'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
      'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
      'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
      'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
    }
    
    const stateName = stateNames[stateCode] || stateCode
    const stateRecord = await getOrCreateState(stateName, stateCode)

    console.log(`Starting data fetch for ${stateName}`)
    const result = await fetchStateData(stateCode)
    
    if (!result.success) {
      await updateScrapingJob(jobId, {
        status: 'FAILED',
        errors: result.errors,
        completedAt: new Date()
      })
      return
    }

    await updateScrapingJob(jobId, {
      billsFound: result.totalFound
    })

    let billsProcessed = 0
    let billsSummarized = 0
    const errors: string[] = [...result.errors]

    console.log(`Processing ${result.bills.length} bills for ${stateName}`)
    console.log(`API queries used: ${result.queriesUsed}`)

    for (const billData of result.bills) {
      try {
        const bill = await createBill({
          title: billData.title,
          billNumber: billData.billNumber,
          status: billData.status,
          stateId: stateRecord.id,
          fullText: billData.fullText,
          lastActionDate: billData.lastActionDate,
          lastAction: billData.lastAction,
          sponsor: billData.sponsor,
          sourceUrl: billData.sourceUrl
        })

        billsProcessed++

        if (billData.fullText && billData.fullText.length > 100) {
          try {
            console.log(`Generating summary for ${billData.billNumber}`)
            const summary = await summarizeBill(
              billData.title,
              billData.fullText,
              stateName
            )

            await createSummary({
              content: summary.brief,
              billId: bill.id,
              type: 'BRIEF',
              keyPoints: summary.keyPoints,
              impact: summary.impact,
              aiModel: 'gpt-4o-mini',
              confidence: summary.confidence
            })

            billsSummarized++
          } catch (aiError) {
            console.error(`AI processing failed for ${billData.billNumber}:`, aiError)
            errors.push(`AI processing failed for ${billData.billNumber}`)
          }
        }
        
        await updateScrapingJob(jobId, {
          billsProcessed,
          billsSummarized
        })

        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (billError) {
        console.error(`Error processing bill ${billData.billNumber}:`, billError)
        errors.push(`Failed to process ${billData.billNumber}: ${billError instanceof Error ? billError.message : 'Unknown error'}`)
      }
    }

    await updateScrapingJob(jobId, {
      status: 'COMPLETED',
      billsProcessed,
      billsSummarized,
      errors,
      completedAt: new Date()
    })

    console.log(`Job ${jobId} completed for ${stateName}`)
    console.log(`Results: ${billsProcessed}/${result.totalFound} bills processed, ${billsSummarized} summarized`)
    console.log(`Cache stats:`, result.cacheStats)

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error)
    await updateScrapingJob(jobId, {
      status: 'FAILED',
      errors: [`Job failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      completedAt: new Date()
    })
  }
}