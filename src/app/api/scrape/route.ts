import { NextRequest, NextResponse } from 'next/server'
import { scrapeBillsForState, validateBillData } from '@/lib/scraper'
import { summarizeBill, extractKeyTerms } from '@/lib/ai'
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

    // Create scraping job
    const job = await createScrapingJob(state.toUpperCase())
    
    // Start scraping in background (in production, use a queue like Bull)
    scrapeBillsBackground(job.id, state.toUpperCase())
    
    return NextResponse.json({
      message: 'Scraping job started',
      jobId: job.id,
      state: state.toUpperCase()
    })
  } catch (error) {
    console.error('Error starting scraping job:', error)
    return NextResponse.json(
      { error: 'Failed to start scraping job' },
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
    // In production, you'd query the job status from the database
    // For now, return a mock status
    return NextResponse.json({
      jobId,
      status: 'RUNNING',
      progress: {
        billsFound: 12,
        billsProcessed: 8,
        billsSummarized: 6
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

async function scrapeBillsBackground(jobId: string, stateCode: string) {
  try {
    // Update job status to running
    await updateScrapingJob(jobId, {
      status: 'RUNNING',
      startedAt: new Date()
    })

    // Get or create the state record
    const stateNames: Record<string, string> = {
      'CA': 'California',
      'TX': 'Texas',
      'NY': 'New York',
      'FL': 'Florida'
    }
    
    const stateName = stateNames[stateCode] || stateCode
    const stateRecord = await getOrCreateState(stateName, stateCode)

    // Scrape bills
    console.log(`Starting to scrape bills for ${stateName}...`)
    const scrapingResult = await scrapeBillsForState(stateCode)
    
    if (!scrapingResult.success) {
      await updateScrapingJob(jobId, {
        status: 'FAILED',
        errors: scrapingResult.errors,
        completedAt: new Date()
      })
      return
    }

    await updateScrapingJob(jobId, {
      billsFound: scrapingResult.totalFound
    })

    let billsProcessed = 0
    const errors: string[] = []

    // Process each bill
    for (const billData of scrapingResult.bills) {
      try {
        // Validate bill data
        const validation = await validateBillData(billData)
        if (!validation.valid) {
          errors.push(`Invalid bill data for ${billData.billNumber}: ${validation.errors.join(', ')}`)
          continue
        }

        // Create bill record
        const bill = await createBill({
          title: billData.title,
          billNumber: billData.billNumber,
          status: billData.status,
          stateId: stateRecord.id,
          fullText: billData.fullText,
          introducedDate: billData.introducedDate,
          lastActionDate: billData.lastActionDate,
          lastAction: billData.lastAction,
          sponsor: billData.sponsor,
          sourceUrl: billData.sourceUrl
        })

        // Generate AI summary if we have full text
        if (billData.fullText) {
          try {
            console.log(`Generating summary for ${billData.billNumber}...`)
            const summary = await summarizeBill(
              billData.title,
              billData.fullText,
              stateName
            )

            // Extract key terms for tagging
            const keyTerms = await extractKeyTerms(billData.fullText)

            // Create summary record
            await createSummary({
              content: summary.brief,
              billId: bill.id,
              type: 'BRIEF',
              keyPoints: summary.keyPoints,
              impact: summary.impact,
              aiModel: 'gpt-4o-mini',
              confidence: summary.confidence
            })

            console.log(`Successfully processed ${billData.billNumber}`)
          } catch (aiError) {
            console.error(`Failed to generate summary for ${billData.billNumber}:`, aiError)
            errors.push(`AI processing failed for ${billData.billNumber}`)
          }
        }

        billsProcessed++
        
        // Update progress
        await updateScrapingJob(jobId, {
          billsProcessed
        })

      } catch (billError) {
        console.error(`Error processing bill ${billData.billNumber}:`, billError)
        errors.push(`Failed to process ${billData.billNumber}: ${billError instanceof Error ? billError.message : 'Unknown error'}`)
      }
    }

    // Complete the job
    await updateScrapingJob(jobId, {
      status: errors.length > 0 ? 'COMPLETED' : 'COMPLETED',
      billsProcessed,
      errors,
      completedAt: new Date()
    })

    console.log(`Scraping job ${jobId} completed. Processed ${billsProcessed}/${scrapingResult.totalFound} bills.`)

  } catch (error) {
    console.error(`Scraping job ${jobId} failed:`, error)
    await updateScrapingJob(jobId, {
      status: 'FAILED',
      errors: [`Job failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      completedAt: new Date()
    })
  }
}