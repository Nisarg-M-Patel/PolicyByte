// src/components/BillCard.tsx
import Link from 'next/link'

interface Bill {
  id: string
  title: string
  summary: string
  status: string
  date: string
}

interface BillCardProps {
  bill: Bill
}

export default function BillCard({ bill }: BillCardProps) {
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
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-white line-clamp-2">
          {bill.title}
        </h3>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
            bill.status
          )}`}
        >
          {bill.status}
        </span>
      </div>
      
      <p className="text-slate-300 text-sm mb-4 line-clamp-3">
        {bill.summary}
      </p>
      
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{new Date(bill.date).toLocaleDateString()}</span>
        <Link 
          href={`/bill/${bill.id}`}
          className="text-blue-400 hover:text-blue-300 font-medium"
        >
          Read More →
        </Link>
      </div>
    </div>
  )
}