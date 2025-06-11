// src/app/bill/[id]/page.tsx
import Link from 'next/link'
import { getBillById } from '@/lib/db'
import { notFound } from 'next/navigation'

interface BillDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function BillDetailPage({ params }: BillDetailPageProps) {
  const { id } = await params
  
  let bill
  try {
    bill = await getBillById(id)
  } catch (error) {
    console.error('Error fetching bill:', error)
    notFound()
  }

  if (!bill) {
    notFound()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'passed':
        return 'bg-green-500'
      case 'engrossed':
        return 'bg-blue-500'
      case 'introduced':
        return 'bg-blue-400'
      case 'failed':
        return 'bg-red-500'
      case 'vetoed':
        return 'bg-red-600'
      default:
        return 'bg-slate-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link 
            href={`/state/${bill.state.code.toLowerCase()}`}
            className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to {bill.state.name} Bills
          </Link>
          
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-4">
                {bill.title}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-lg font-medium text-blue-400">
                  {bill.billNumber}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(bill.status)}`}
                >
                  {bill.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Summary */}
            {bill.summaries && bill.summaries.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-4">Summary</h2>
                <p className="text-slate-300 leading-relaxed">
                  {bill.summaries[0].content}
                </p>
                
                {bill.summaries[0].keyPoints && bill.summaries[0].keyPoints.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-white mb-3">Key Points</h3>
                    <ul className="space-y-2">
                      {bill.summaries[0].keyPoints.map((point, index) => (
                        <li key={index} className="text-slate-300 flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {bill.summaries[0].impact && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-white mb-3">Impact</h3>
                    <p className="text-slate-300">{bill.summaries[0].impact}</p>
                  </div>
                )}
              </div>
            )}

            {/* Full Text */}
            {bill.fullText && (
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-4">Full Text</h2>
                <div className="text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed max-h-96 overflow-y-auto">
                  {bill.fullText}
                </div>
              </div>
            )}

            {!bill.summaries?.length && !bill.fullText && (
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 text-center">
                <p className="text-slate-400">
                  No detailed information available for this bill yet.
                </p>
                {bill.sourceUrl && (
                  <a
                    href={bill.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 mt-2 inline-block"
                  >
                    View on LegiScan →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bill Details */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Bill Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-slate-400 text-sm">Bill Number</span>
                  <p className="text-white font-medium">{bill.billNumber}</p>
                </div>
                
                <div>
                  <span className="text-slate-400 text-sm">Status</span>
                  <p className="text-white">{bill.status}</p>
                </div>

                {bill.sponsor && (
                  <div>
                    <span className="text-slate-400 text-sm">Sponsor</span>
                    <p className="text-white">{bill.sponsor}</p>
                  </div>
                )}

                {bill.lastActionDate && (
                  <div>
                    <span className="text-slate-400 text-sm">Last Action</span>
                    <p className="text-white">
                      {bill.lastActionDate.toLocaleDateString()}
                    </p>
                    {bill.lastAction && (
                      <p className="text-slate-300 text-sm mt-1">{bill.lastAction}</p>
                    )}
                  </div>
                )}

                {bill.introducedDate && (
                  <div>
                    <span className="text-slate-400 text-sm">Introduced</span>
                    <p className="text-white">
                      {bill.introducedDate.toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* External Links */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">External Links</h3>
              <div className="space-y-2">
                {bill.sourceUrl && (
                  <a
                    href={bill.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-400 hover:text-blue-300 text-sm"
                  >
                    View on LegiScan ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}