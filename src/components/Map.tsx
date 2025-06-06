'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as d3 from 'd3-geo'
import { feature } from 'topojson-client'

const stateData = {
  'Alabama': { bills: 9, abbrev: 'AL', id: '01' },
  'Alaska': { bills: 3, abbrev: 'AK', id: '02' },
  'Arizona': { bills: 11, abbrev: 'AZ', id: '04' },
  'Arkansas': { bills: 6, abbrev: 'AR', id: '05' },
  'California': { bills: 54, abbrev: 'CA', id: '06' },
  'Colorado': { bills: 10, abbrev: 'CO', id: '08' },
  'Connecticut': { bills: 7, abbrev: 'CT', id: '09' },
  'Delaware': { bills: 3, abbrev: 'DE', id: '10' },
  'Florida': { bills: 30, abbrev: 'FL', id: '12' },
  'Georgia': { bills: 16, abbrev: 'GA', id: '13' },
  'Hawaii': { bills: 4, abbrev: 'HI', id: '15' },
  'Idaho': { bills: 4, abbrev: 'ID', id: '16' },
  'Illinois': { bills: 19, abbrev: 'IL', id: '17' },
  'Indiana': { bills: 11, abbrev: 'IN', id: '18' },
  'Iowa': { bills: 6, abbrev: 'IA', id: '19' },
  'Kansas': { bills: 6, abbrev: 'KS', id: '20' },
  'Kentucky': { bills: 8, abbrev: 'KY', id: '21' },
  'Louisiana': { bills: 8, abbrev: 'LA', id: '22' },
  'Maine': { bills: 4, abbrev: 'ME', id: '23' },
  'Maryland': { bills: 10, abbrev: 'MD', id: '24' },
  'Massachusetts': { bills: 11, abbrev: 'MA', id: '25' },
  'Michigan': { bills: 15, abbrev: 'MI', id: '26' },
  'Minnesota': { bills: 10, abbrev: 'MN', id: '27' },
  'Mississippi': { bills: 6, abbrev: 'MS', id: '28' },
  'Missouri': { bills: 10, abbrev: 'MO', id: '29' },
  'Montana': { bills: 4, abbrev: 'MT', id: '30' },
  'Nebraska': { bills: 5, abbrev: 'NE', id: '31' },
  'Nevada': { bills: 6, abbrev: 'NV', id: '32' },
  'New Hampshire': { bills: 4, abbrev: 'NH', id: '33' },
  'New Jersey': { bills: 14, abbrev: 'NJ', id: '34' },
  'New Mexico': { bills: 5, abbrev: 'NM', id: '35' },
  'New York': { bills: 28, abbrev: 'NY', id: '36' },
  'North Carolina': { bills: 16, abbrev: 'NC', id: '37' },
  'North Dakota': { bills: 3, abbrev: 'ND', id: '38' },
  'Ohio': { bills: 17, abbrev: 'OH', id: '39' },
  'Oklahoma': { bills: 7, abbrev: 'OK', id: '40' },
  'Oregon': { bills: 8, abbrev: 'OR', id: '41' },
  'Pennsylvania': { bills: 19, abbrev: 'PA', id: '42' },
  'Rhode Island': { bills: 4, abbrev: 'RI', id: '44' },
  'South Carolina': { bills: 9, abbrev: 'SC', id: '45' },
  'South Dakota': { bills: 3, abbrev: 'SD', id: '46' },
  'Tennessee': { bills: 11, abbrev: 'TN', id: '47' },
  'Texas': { bills: 40, abbrev: 'TX', id: '48' },
  'Utah': { bills: 6, abbrev: 'UT', id: '49' },
  'Vermont': { bills: 3, abbrev: 'VT', id: '50' },
  'Virginia': { bills: 13, abbrev: 'VA', id: '51' },
  'Washington': { bills: 12, abbrev: 'WA', id: '53' },
  'West Virginia': { bills: 4, abbrev: 'WV', id: '54' },
  'Wisconsin': { bills: 10, abbrev: 'WI', id: '55' },
  'Wyoming': { bills: 3, abbrev: 'WY', id: '56' },
  'District of Columbia': { bills: 3, abbrev: 'DC', id: '11' }
}

export default function React19ProfessionalMap() {
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [usTopology, setUsTopology] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Load US topology data
    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
      .then(response => response.json())
      .then(data => setUsTopology(data))
  }, [])

  const getBillColor = (billCount: number) => {
    if (billCount === 0) return '#6B7280' // gray-500
    if (billCount <= 5) return '#3B82F6' // blue-500
    if (billCount <= 15) return '#1D4ED8' // blue-700
    if (billCount <= 25) return '#1E40AF' // blue-800
    return '#1E3A8A' // blue-900
  }

  const handleStateClick = (stateName: string) => {
    const state = stateData[stateName as keyof typeof stateData]
    if (state) {
      router.push(`/state/${state.abbrev.toLowerCase()}`)
    }
  }

  const totalBills = Object.values(stateData).reduce((sum, state) => sum + state.bills, 0)

  if (!usTopology) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">🗺️</div>
          <div>Loading Professional Map...</div>
        </div>
      </div>
    )
  }

  const states = feature(usTopology, usTopology.objects.states)
  const projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305])
  const pathGenerator = d3.geoPath().projection(projection)

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <div className="bg-black border-b border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            Interactive Legislative Map | <span className="text-gray-400 font-normal">PolicyByte</span>
          </h1>
          <div className="flex gap-3">
            <button className="text-blue-400 hover:text-blue-300 text-sm">Switch Maps 🔄</button>
            <button className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm font-medium">
              Review and Share 📤
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-bold">📊</span>
              </div>
              <div>
                <div className="text-white font-semibold">Active Bills</div>
                <div className="text-blue-400 text-2xl font-bold">{totalBills}</div>
              </div>
            </div>
            
            <div className="flex-1 max-w-md relative">
              <div className="h-2 bg-gray-700 rounded-full">
                <div className="h-full bg-blue-500 rounded-full" style={{width: '67%'}}></div>
              </div>
              <div className="absolute left-2/3 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
              <div className="text-center text-gray-400 text-sm mt-1">to analyze</div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-white font-bold">⚖️</span>
              </div>
              <div>
                <div className="text-white font-semibold">Passed</div>
                <div className="text-red-400 text-2xl font-bold">0</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Professional Map */}
        <div className="flex-1 relative bg-gray-900">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 975 610"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <rect width="975" height="610" fill="#111827" />
            
            {states.features.map((state: any) => {
              const stateName = state.properties.NAME
              const stateInfo = stateData[stateName as keyof typeof stateData]
              const billCount = stateInfo?.bills || 0
              const pathData = pathGenerator(state)
              
              if (!pathData) return null
              
              // Calculate centroid for label positioning
              const centroid = pathGenerator.centroid(state)
              
              return (
                <g key={state.id}>
                  <path
                    d={pathData}
                    fill={getBillColor(billCount)}
                    stroke="#374151"
                    strokeWidth="0.5"
                    className="cursor-pointer transition-all duration-300 hover:stroke-white hover:stroke-2"
                    style={{
                      filter: hoveredState === stateName ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' : 'none'
                    }}
                    onMouseEnter={() => setHoveredState(stateName)}
                    onMouseLeave={() => setHoveredState(null)}
                    onClick={() => handleStateClick(stateName)}
                  />
                  {/* State Bill Count Labels */}
                  {stateInfo && centroid && (
                    <text
                      x={centroid[0]}
                      y={centroid[1]}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-white font-bold pointer-events-none select-none"
                      style={{ 
                        fontSize: billCount > 20 ? '14px' : '12px',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                      }}
                    >
                      {billCount}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-6 left-6 bg-black bg-opacity-90 rounded-lg p-4 border border-gray-700">
            <h3 className="text-white font-semibold mb-3 text-sm">Active Bills</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-xs">
                <div className="w-4 h-3 bg-gray-500 border border-gray-400"></div>
                <span className="text-gray-300">No Activity</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="w-4 h-3 bg-blue-500 border border-blue-400"></div>
                <span className="text-gray-300">Low (1-5)</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="w-4 h-3 bg-blue-700 border border-blue-600"></div>
                <span className="text-gray-300">Medium (6-15)</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="w-4 h-3 bg-blue-800 border border-blue-700"></div>
                <span className="text-gray-300">High (16-25)</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="w-4 h-3 bg-blue-900 border border-blue-800"></div>
                <span className="text-gray-300">Very High (26+)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-700">
            <div className="flex gap-1">
              <button className="px-4 py-2 bg-white text-black rounded-sm text-sm font-medium">
                All States
              </button>
              <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-sm text-sm">
                Key Bills
              </button>
            </div>
          </div>

          <div className="p-3">
            <div className="text-xs text-gray-400 px-2 py-2 flex justify-between border-b border-gray-700 mb-2">
              <span>State (Active Bills)</span>
              <span>Status</span>
            </div>

            {Object.entries(stateData)
              .sort(([,a], [,b]) => b.bills - a.bills)
              .slice(0, 15)
              .map(([stateName, state]) => (
                <div
                  key={stateName}
                  className="flex items-center justify-between p-2 hover:bg-gray-700 cursor-pointer rounded text-sm transition-colors"
                  onClick={() => router.push(`/state/${state.abbrev.toLowerCase()}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center">
                        <span className="text-xs">📊</span>
                      </div>
                      <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center">
                        <span className="text-xs">⚖️</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-white font-medium">{stateName} ({state.bills})</div>
                      <div className="text-gray-400 text-xs">Active Legislation</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Professional Tooltip */}
      {hoveredState && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-95 text-white p-4 rounded-lg border border-gray-600 shadow-2xl z-50 pointer-events-none">
          <h3 className="font-semibold text-lg">{hoveredState}</h3>
          <p className="text-gray-300 text-sm">
            {stateData[hoveredState as keyof typeof stateData]?.bills} active bills
          </p>
          <p className="text-blue-400 text-xs mt-1">Click to explore →</p>
        </div>
      )}
    </div>
  )
}