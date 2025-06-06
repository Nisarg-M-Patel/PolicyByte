import Link from 'next/link'
import BillCard from '@/components/BillCard'

interface StatePageProps {
  params: {
    state: string
  }
}

// Mock data for now
const mockBills = [
  {
    id: '1',
    title: 'Education Funding Reform Act',
    summary: 'Increases funding for public schools by 15% and establishes new teacher retention programs.',
    status: 'In Committee',
    date: '2025-05-15',
  },
  {
    id: '2',
    title: 'Clean Energy Initiative',
    summary: 'Provides tax incentives for renewable energy adoption and sets carbon reduction targets.',
    status: 'Passed House',
    date: '2025-05-10',
  },
]

export default function StatePage({ params }: StatePageProps) {
  const stateCode = params.state.toUpperCase()
  const stateName = getStateName(stateCode)

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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockBills.map((bill) => (
            <BillCard key={bill.id} bill={bill} />
          ))}
        </div>

        {mockBills.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">
              No bills available for {stateName} yet.
            </p>
            <p className="text-slate-500 mt-2">
              Check back soon as we add more states to our system.
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
    // Add more as needed
  }
  return states[code] || code
}