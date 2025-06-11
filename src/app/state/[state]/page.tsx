import Link from 'next/link'
import BillCard from '@/components/BillCard'
import { getBillsByState } from '@/lib/db'

interface StatePageProps {
  params: Promise<{
    state: string
  }>
}

interface Bill {
  id: string
  title: string
  status: string
  lastActionDate: Date | null
  createdAt: Date
  summaries: Array<{
    content: string
  }>
}

export default async function StatePage({ params }: StatePageProps) {
  const { state } = await params
  const stateCode = state.toUpperCase()
  const stateName = getStateName(stateCode)

  let bills: Bill[] = []
  try {
    bills = await getBillsByState(stateCode)
  } catch (error) {
    console.error('Error fetching bills:', error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link 
            href="/"
            className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to Map
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">
            {stateName} Legislation
          </h1>
          <p className="text-slate-300">
            Current bills and policy changes in {stateName}
          </p>
        </div>

        {bills.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bills.map((bill) => (
              <BillCard 
                key={bill.id} 
                bill={{
                  id: bill.id,
                  title: bill.title,
                  summary: bill.summaries[0]?.content || 'No summary available',
                  status: bill.status,
                  date: bill.lastActionDate?.toISOString().split('T')[0] || bill.createdAt.toISOString().split('T')[0]
                }} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">
              No bills available for {stateName} yet.
            </p>
            <p className="text-slate-500 mt-2">
              Visit the admin panel to start collecting legislative data.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function getStateName(code: string): string {
  const states: Record<string, string> = {
    'CA': 'California',
    'TX': 'Texas', 
    'NY': 'New York',
    'FL': 'Florida',
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois',
    'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky',
    'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts',
    'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
    'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire',
    'NJ': 'New Jersey', 'NM': 'New Mexico', 'NC': 'North Carolina',
    'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon',
    'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'UT': 'Utah', 'VT': 'Vermont',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
  }
  return states[code] || code
}
