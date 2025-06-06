import { NextRequest, NextResponse } from 'next/server'
import { getBillsByState, getBillById, getBillStats } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const state = searchParams.get('state')
  const id = searchParams.get('id')
  const stats = searchParams.get('stats')

  try {
    // Get bill statistics
    if (stats === 'true') {
      const billStats = await getBillStats()
      return NextResponse.json({
        success: true,
        data: billStats
      })
    }

    // Get specific bill by ID
    if (id) {
      const bill = await getBillById(id)
      
      if (!bill) {
        return NextResponse.json(
          { error: 'Bill not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: bill
      })
    }

    // Get bills by state
    if (state) {
      const bills = await getBillsByState(state)
      
      return NextResponse.json({
        success: true,
        data: bills,
        count: bills.length
      })
    }

    // No specific query provided
    return NextResponse.json(
      { error: 'Please specify state, id, or stats parameter' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error fetching bills:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    )
  }
}