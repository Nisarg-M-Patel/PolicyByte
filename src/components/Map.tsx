'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const stateData = {
  'AL': { name: 'Alabama', bills: 0 },
  'AK': { name: 'Alaska', bills: 0 },
  'AZ': { name: 'Arizona', bills: 0 },
  'AR': { name: 'Arkansas', bills: 0 },
  'CA': { name: 'California', bills: 0 },
  'CO': { name: 'Colorado', bills: 0 },
  'CT': { name: 'Connecticut', bills: 0 },
  'DE': { name: 'Delaware', bills: 0 },
  'FL': { name: 'Florida', bills: 0 },
  'GA': { name: 'Georgia', bills: 0 },
  'HI': { name: 'Hawaii', bills: 0 },
  'ID': { name: 'Idaho', bills: 0 },
  'IL': { name: 'Illinois', bills: 0 },
  'IN': { name: 'Indiana', bills: 0 },
  'IA': { name: 'Iowa', bills: 0 },
  'KS': { name: 'Kansas', bills: 0 },
  'KY': { name: 'Kentucky', bills: 0 },
  'LA': { name: 'Louisiana', bills: 0 },
  'ME': { name: 'Maine', bills: 0 },
  'MD': { name: 'Maryland', bills: 0 },
  'MA': { name: 'Massachusetts', bills: 0 },
  'MI': { name: 'Michigan', bills: 0 },
  'MN': { name: 'Minnesota', bills: 0 },
  'MS': { name: 'Mississippi', bills: 0 },
  'MO': { name: 'Missouri', bills: 0 },
  'MT': { name: 'Montana', bills: 0 },
  'NE': { name: 'Nebraska', bills: 0 },
  'NV': { name: 'Nevada', bills: 0 },
  'NH': { name: 'New Hampshire', bills: 0 },
  'NJ': { name: 'New Jersey', bills: 0 },
  'NM': { name: 'New Mexico', bills: 0 },
  'NY': { name: 'New York', bills: 0 },
  'NC': { name: 'North Carolina', bills: 0 },
  'ND': { name: 'North Dakota', bills: 0 },
  'OH': { name: 'Ohio', bills: 0 },
  'OK': { name: 'Oklahoma', bills: 0 },
  'OR': { name: 'Oregon', bills: 0 },
  'PA': { name: 'Pennsylvania', bills: 0 },
  'RI': { name: 'Rhode Island', bills: 0 },
  'SC': { name: 'South Carolina', bills: 0 },
  'SD': { name: 'South Dakota', bills: 0 },
  'TN': { name: 'Tennessee', bills: 0 },
  'TX': { name: 'Texas', bills: 0 },
  'UT': { name: 'Utah', bills: 0 },
  'VT': { name: 'Vermont', bills: 0 },
  'VA': { name: 'Virginia', bills: 0 },
  'WA': { name: 'Washington', bills: 0 },
  'WV': { name: 'West Virginia', bills: 0 },
  'WI': { name: 'Wisconsin', bills: 0 },
  'WY': { name: 'Wyoming', bills: 0 },
}

export default function Map() {
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const router = useRouter()

  const handleStateClick = (stateCode: string) => {
    router.push(`/state/${stateCode.toLowerCase()}`)
  }

  return (
    <div className="relative">
      <svg
        width="800"
        height="500"
        viewBox="0 0 800 500"
        className="bg-slate-800 rounded-lg shadow-2xl border border-slate-600"
      >
        {/* This is a simplified SVG - you'll want to replace with proper state paths */}
        <text
          x="400"
          y="250"
          textAnchor="middle"
          className="fill-slate-400 text-sm font-medium"
        >
          Interactive US Map
        </text>
        <text
          x="400"
          y="270"
          textAnchor="middle"
          className="fill-slate-500 text-xs"
        >
          (SVG state paths will be added here)
        </text>
        
        {/* Placeholder clickable areas for demo */}
        <rect
          x="100"
          y="200"
          width="60"
          height="40"
          className="fill-slate-600 hover:fill-blue-500 cursor-pointer transition-colors"
          onClick={() => handleStateClick('CA')}
        />
        <text
          x="130"
          y="223"
          textAnchor="middle"
          className="fill-white text-xs font-medium pointer-events-none"
        >
          CA
        </text>
        
        <rect
          x="300"
          y="180"
          width="60"
          height="40"
          className="fill-slate-600 hover:fill-blue-500 cursor-pointer transition-colors"
          onClick={() => handleStateClick('TX')}
        />
        <text
          x="330"
          y="203"
          textAnchor="middle"
          className="fill-white text-xs font-medium pointer-events-none"
        >
          TX
        </text>
        
        <rect
          x="500"
          y="160"
          width="60"
          height="40"
          className="fill-slate-600 hover:fill-blue-500 cursor-pointer transition-colors"
          onClick={() => handleStateClick('NY')}
        />
        <text
          x="530"
          y="183"
          textAnchor="middle"
          className="fill-white text-xs font-medium pointer-events-none"
        >
          NY
        </text>
      </svg>
      
      {hoveredState && (
        <div className="absolute top-4 right-4 bg-slate-700 text-white p-3 rounded-lg shadow-lg">
          <h3 className="font-semibold">{stateData[hoveredState as keyof typeof stateData]?.name}</h3>
          <p className="text-sm text-slate-300">
            {stateData[hoveredState as keyof typeof stateData]?.bills} active bills
          </p>
        </div>
      )}
    </div>
  )
}