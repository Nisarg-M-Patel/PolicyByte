interface BillData {
  title: string
  billNumber: string
  status: string
  introducedDate?: Date
  lastActionDate?: Date
  lastAction?: string
  sponsor?: string
  fullText?: string
  summary?: string
  sourceUrl: string
}

interface ScrapingResult {
  success: boolean
  bills: BillData[]
  errors: string[]
  totalFound: number
}

// State-specific scraping configurations
const SCRAPING_CONFIGS = {
  CA: {
    name: 'California',
    baseUrl: 'https://leginfo.legislature.ca.gov',
    billListUrl: 'https://leginfo.legislature.ca.gov/faces/billSearchClient.xhtml',
    selectors: {
      billLinks: '.bill-list a',
      title: '.bill-title',
      status: '.bill-status',
      text: '.bill-text'
    }
  },
  TX: {
    name: 'Texas',
    baseUrl: 'https://capitol.texas.gov',
    billListUrl: 'https://capitol.texas.gov/Search/BillSearch.aspx',
    selectors: {
      billLinks: '.bill-row a',
      title: 'h1.bill-title',
      status: '.status-text',
      text: '.bill-text-content'
    }
  },
  NY: {
    name: 'New York',
    baseUrl: 'https://www.nysenate.gov',
    billListUrl: 'https://www.nysenate.gov/legislation/bills',
    selectors: {
      billLinks: '.bill-listing a',
      title: '.bill-title',
      status: '.bill-status',
      text: '.bill-full-text'
    }
  },
  FL: {
    name: 'Florida',
    baseUrl: 'https://www.flsenate.gov',
    billListUrl: 'https://www.flsenate.gov/Session/Bills',
    selectors: {
      billLinks: '.bill-list-item a',
      title: '.bill-title',
      status: '.bill-status',
      text: '.bill-text'
    }
  }
}

export async function scrapeBillsForState(stateCode: string): Promise<ScrapingResult> {
  const config = SCRAPING_CONFIGS[stateCode.toUpperCase() as keyof typeof SCRAPING_CONFIGS]
  
  if (!config) {
    return {
      success: false,
      bills: [],
      errors: [`Scraping not configured for state: ${stateCode}`],
      totalFound: 0
    }
  }

  const result: ScrapingResult = {
    success: false,
    bills: [],
    errors: [],
    totalFound: 0
  }

  try {
    console.log(`Starting scrape for ${config.name}...`)
    
    // This is a simplified example - in production you'd use Puppeteer or similar
    // For now, we'll simulate the scraping process
    const bills = await simulateStateScraping(stateCode, config)
    
    result.bills = bills
    result.totalFound = bills.length
    result.success = true
    
    console.log(`Successfully scraped ${bills.length} bills for ${config.name}`)
    
  } catch (error) {
    console.error(`Error scraping ${config.name}:`, error)
    result.errors.push(`Failed to scrape ${config.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

// Simulated scraping for demo purposes
// In production, replace with actual web scraping logic
async function simulateStateScraping(stateCode: string, config: any): Promise<BillData[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  const mockBills: BillData[] = []
  const billCount = Math.floor(Math.random() * 15) + 5 // 5-20 bills
  
  for (let i = 1; i <= billCount; i++) {
    const billNumber = `${stateCode.toUpperCase()}-${2025}-${String(i).padStart(4, '0')}`
    const topics = ['Education', 'Healthcare', 'Environment', 'Transportation', 'Economy', 'Criminal Justice']
    const topic = topics[Math.floor(Math.random() * topics.length)]
    const statuses = ['Introduced', 'In Committee', 'Passed House', 'Passed Senate', 'Enrolled', 'Signed']
    
    mockBills.push({
      title: `${topic} Reform Act of 2025 - Bill ${i}`,
      billNumber,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      introducedDate: new Date(2025, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1),
      lastActionDate: new Date(),
      lastAction: 'Referred to committee',
      sponsor: `Rep. ${['Smith', 'Johnson', 'Williams', 'Brown', 'Davis'][Math.floor(Math.random() * 5)]}`,
      fullText: generateMockBillText(topic, billNumber),
      sourceUrl: `${config.baseUrl}/bills/${billNumber}`
    })
  }
  
  return mockBills
}

function generateMockBillText(topic: string, billNumber: string): string {
  const templates = {
    Education: `
AN ACT relating to education funding and teacher support.

SECTION 1. SHORT TITLE
This Act may be cited as the "${topic} Enhancement Act".

SECTION 2. FINDINGS AND PURPOSE
The Legislature finds that:
(1) Investment in education is critical for economic development
(2) Teachers need additional support and resources
(3) Student outcomes can be improved through targeted funding

SECTION 3. FUNDING PROVISIONS
The state shall allocate additional funding of $100 million annually for:
(a) Teacher salary increases
(b) Classroom technology upgrades
(c) Professional development programs

SECTION 4. IMPLEMENTATION
This Act takes effect on July 1, 2025.
`,
    Healthcare: `
AN ACT relating to healthcare access and affordability.

SECTION 1. SHORT TITLE
This Act may be cited as the "Healthcare Access Improvement Act".

SECTION 2. PURPOSE
To expand healthcare access for underserved populations and reduce medical costs.

SECTION 3. PROVISIONS
(a) Establish community health centers in rural areas
(b) Provide subsidies for prescription medications
(c) Create telemedicine infrastructure

SECTION 4. FUNDING
Appropriates $50 million from the general fund for implementation.

SECTION 5. EFFECTIVE DATE
This Act takes effect January 1, 2026.
`,
    Environment: `
AN ACT relating to environmental protection and clean energy.

SECTION 1. SHORT TITLE
This Act may be cited as the "Clean Environment Initiative".

SECTION 2. ENVIRONMENTAL GOALS
The state commits to:
(1) Reducing carbon emissions by 25% by 2030
(2) Increasing renewable energy to 50% of total energy mix
(3) Protecting critical wildlife habitats

SECTION 3. IMPLEMENTATION MEASURES
(a) Tax incentives for solar and wind energy
(b) Grants for electric vehicle infrastructure
(c) Enhanced penalties for environmental violations

SECTION 4. EFFECTIVE DATE
This Act takes effect upon passage.
`
  }
  
  return templates[topic as keyof typeof templates] || templates.Education
}

export async function scrapeBillText(url: string): Promise<string | null> {
  try {
    // In production, use fetch + cheerio or Puppeteer to extract bill text
    // For now, return mock text
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return `
MOCK BILL TEXT FOR: ${url}

This is simulated bill text that would be extracted from the provided URL.
In a production environment, this would contain the actual legislative text
scraped from the state's legislative website.

The text would include sections, subsections, and detailed legal language
describing the proposed legislation, its scope, implementation details,
funding requirements, and effective dates.
`
  } catch (error) {
    console.error(`Error scraping bill text from ${url}:`, error)
    return null
  }
}

export async function validateBillData(bill: Partial<BillData>): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []
  
  if (!bill.title || bill.title.trim().length === 0) {
    errors.push('Bill title is required')
  }
  
  if (!bill.billNumber || bill.billNumber.trim().length === 0) {
    errors.push('Bill number is required')
  }
  
  if (!bill.status || bill.status.trim().length === 0) {
    errors.push('Bill status is required')
  }
  
  if (!bill.sourceUrl || !isValidUrl(bill.sourceUrl)) {
    errors.push('Valid source URL is required')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

export function getAvailableStates(): string[] {
  return Object.keys(SCRAPING_CONFIGS)
}

export function getStateConfig(stateCode: string) {
  return SCRAPING_CONFIGS[stateCode.toUpperCase() as keyof typeof SCRAPING_CONFIGS]
}