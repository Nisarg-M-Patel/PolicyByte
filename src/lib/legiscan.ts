// src/lib/legiscan-optimized.ts
interface LegiScanConfig {
  apiKey: string
  baseUrl: string
}

interface BillSearchResult {
  bill_id: number
  bill_number: string
  title: string
  status: number
  status_date: string
  url: string
  last_action_date: string
  last_action: string
  change_hash: string  // For detecting changes
}

interface BillDetail {
  bill_id: number
  bill_number: string
  title: string
  description: string
  status: number
  status_date: string
  url: string
  last_action_date: string
  last_action: string
  change_hash: string
  sponsors: Array<{
    people_id: number
    name: string
    role: string
  }>
  texts: Array<{
    doc_id: number
    type: string
    url: string
    date: string
  }>
  history: Array<{
    date: string
    action: string
    chamber: string
  }>
}

interface BillText {
  doc_id: number
  bill_id: number
  date: string
  type: string
  url: string
  text?: string
}

interface SessionInfo {
  session_id: number
  year_start: number
  year_end: number
  session_name: string
  prior: number
  special: number
}

// Cache interface for storing responses locally
interface CacheEntry {
  data: any
  hash?: string
  timestamp: number
  expiresAt: number
}

class LegiScanAPIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'LegiScanAPIError'
  }
}

export class LegiScanAPI {
  private config: LegiScanConfig
  private cache: Map<string, CacheEntry> = new Map()
  private queryCount: number = 0
  private lastRequestTime: number = 0

  constructor(apiKey: string) {
    this.config = {
      apiKey,
      baseUrl: 'https://api.legiscan.com'
    }
  }

  private async rateLimitedRequest(operation: string, params: Record<string, any> = {}): Promise<any> {
    // Respect timing guidelines - minimum 100ms between requests
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < 100) {
      await new Promise(resolve => setTimeout(resolve, 100 - timeSinceLastRequest))
    }

    this.lastRequestTime = Date.now()
    this.queryCount++

    console.log(`LegiScan query ${this.queryCount}: ${operation}`)

    const url = new URL('/?' + operation, this.config.baseUrl)
    url.searchParams.set('key', this.config.apiKey)
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    }

    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new LegiScanAPIError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status
      )
    }

    const data = await response.json()
    
    if (data.status === 'ERROR') {
      throw new LegiScanAPIError(data.alert?.message || 'API error')
    }

    return data
  }

  private getCacheKey(operation: string, params: Record<string, any>): string {
    return `${operation}:${JSON.stringify(params)}`
  }

  private getCachedData(cacheKey: string): any | null {
    const entry = this.cache.get(cacheKey)
    if (!entry) return null
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey)
      return null
    }
    
    console.log(`Cache hit for ${cacheKey}`)
    return entry.data
  }

  private setCachedData(cacheKey: string, data: any, hash?: string, ttlMinutes: number = 60): void {
    const entry: CacheEntry = {
      data,
      hash,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttlMinutes * 60 * 1000)
    }
    this.cache.set(cacheKey, entry)
  }

  // Check if cached data is still valid using hash comparison
  private isCacheValid(cacheKey: string, newHash?: string): boolean {
    const entry = this.cache.get(cacheKey)
    if (!entry || !newHash) return false
    return entry.hash === newHash
  }

  async getSessionList(state: string): Promise<SessionInfo[]> {
    const cacheKey = this.getCacheKey('getSessionList', { state })
    
    // Sessions don't change often, cache for 24 hours
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    const data = await this.rateLimitedRequest('getSessionList', { state })
    const sessions = data.sessions || []
    
    this.setCachedData(cacheKey, sessions, undefined, 24 * 60) // 24 hours
    return sessions
  }

  async getMasterListRaw(sessionId: number): Promise<{
    bills: BillSearchResult[]
    hasChanges: boolean
  }> {
    const cacheKey = this.getCacheKey('getMasterListRaw', { id: sessionId })
    
    // Always fetch master list raw to check for changes via hash
    const data = await this.rateLimitedRequest('getMasterListRaw', { id: sessionId })
    const bills = data.masterlist || []
    
    // Check if we have cached data and if hashes indicate changes
    const cached = this.getCachedData(cacheKey)
    let hasChanges = true
    
    if (cached && bills.length > 0) {
      // Compare hashes to detect changes
      const newHashes = bills.map((bill: BillSearchResult) => bill.change_hash).sort()
      const oldHashes = cached.map((bill: BillSearchResult) => bill.change_hash).sort()
      hasChanges = JSON.stringify(newHashes) !== JSON.stringify(oldHashes)
    }
    
    if (hasChanges) {
      this.setCachedData(cacheKey, bills, undefined, 60) // 1 hour
      console.log(`Master list updated for session ${sessionId}`)
    } else {
      console.log(`No changes in master list for session ${sessionId}`)
    }
    
    return { bills, hasChanges }
  }

  async getBillWithCache(billId: number, expectedHash?: string): Promise<BillDetail | null> {
    const cacheKey = this.getCacheKey('getBill', { id: billId })
    
    // If we have a hash and cached data matches, return cached version
    if (expectedHash && this.isCacheValid(cacheKey, expectedHash)) {
      console.log(`Bill ${billId} unchanged, using cache`)
      return this.getCachedData(cacheKey)
    }
    
    // Otherwise fetch fresh data
    const data = await this.rateLimitedRequest('getBill', { id: billId })
    const bill = data.bill
    
    if (bill) {
      this.setCachedData(cacheKey, bill, bill.change_hash, 240) // 4 hours
    }
    
    return bill
  }

  async getBillText(docId: number): Promise<BillText> {
    const cacheKey = this.getCacheKey('getBillText', { id: docId })
    
    // Bill text rarely changes, cache for longer
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    const data = await this.rateLimitedRequest('getBillText', { id: docId })
    const textData = data.text
    
    this.setCachedData(cacheKey, textData, undefined, 24 * 60) // 24 hours
    return textData
  }

  async getCurrentSession(state: string): Promise<SessionInfo | null> {
    const sessions = await this.getSessionList(state)
    const currentSession = sessions.find(s => !s.prior && !s.special)
    return currentSession || sessions[0] || null
  }

  // Optimized method that only fetches bills that have actually changed
  async getUpdatedBills(state: string, limit: number = 25): Promise<{
    bills: BillDetail[]
    newBillsCount: number
    updatedBillsCount: number
    queriesUsed: number
  }> {
    const startQueryCount = this.queryCount
    
    const session = await this.getCurrentSession(state)
    if (!session) {
      throw new LegiScanAPIError(`No current session found for state: ${state}`)
    }

    // Get master list with change detection
    const { bills: masterList, hasChanges } = await this.getMasterListRaw(session.session_id)
    
    if (!hasChanges) {
      console.log(`No changes detected in ${state}, skipping detailed fetch`)
      return {
        bills: [],
        newBillsCount: 0,
        updatedBillsCount: 0,
        queriesUsed: this.queryCount - startQueryCount
      }
    }

    const recentBills = masterList
      .sort((a, b) => new Date(b.last_action_date).getTime() - new Date(a.last_action_date).getTime())
      .slice(0, limit)

    const bills: BillDetail[] = []
    let newBillsCount = 0
    let updatedBillsCount = 0

    for (const billSummary of recentBills) {
      try {
        const billDetail = await this.getBillWithCache(billSummary.bill_id, billSummary.change_hash)
        
        if (billDetail) {
          bills.push(billDetail)
          
          // Check if this was a cache hit or new fetch
          const wasCached = this.isCacheValid(
            this.getCacheKey('getBill', { id: billSummary.bill_id }), 
            billSummary.change_hash
          )
          
          if (wasCached) {
            // No change, was cached
          } else {
            updatedBillsCount++
          }
        }
      } catch (error) {
        console.error(`Error fetching bill ${billSummary.bill_id}:`, error)
      }
    }

    return {
      bills,
      newBillsCount,
      updatedBillsCount,
      queriesUsed: this.queryCount - startQueryCount
    }
  }

  getQueryCount(): number {
    return this.queryCount
  }

  getCacheStats(): { size: number; hitRate: string } {
    return {
      size: this.cache.size,
      hitRate: 'Tracking not implemented' // Could add hit/miss tracking
    }
  }
}