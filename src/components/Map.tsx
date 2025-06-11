'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import * as d3 from 'd3-geo'
import { feature } from 'topojson-client'

interface StateData {
  bills: number
  abbrev: string
  id: string
}

const stateAbbreviations: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC'
}

export default function Map() {
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [usTopology, setUsTopology] = useState<any>(null)
  const [stateData, setStateData] = useState<Record<string, StateData>>({})
  const [totalBills, setTotalBills] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Load US topology data
    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
      .then(response => response.json())
      .then(data => setUsTopology(data))
  }, [])

  useEffect(() => {
    // Fetch real bill statistics from database
    fetch('/api/bills?stats=true')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const stateMap: Record<string, StateData> = {}
          let total = 0

          // Initialize all states with 0 bills
          Object.entries(stateAbbreviations).forEach(([stateName, abbrev]) => {
            stateMap[stateName] = {
              bills: 0,
              abbrev,
              id: abbrev
            }
          })

          // Update with actual bill counts from database
          if (data.data.byState) {
            data.data.byState.forEach((stateInfo: any) => {
              if (stateInfo.state) {
                const stateName = stateInfo.state.name
                if (stateMap[stateName]) {
                  stateMap[stateName].bills = stateInfo._count
                  total += stateInfo._count
                }
              }
            })
          }

          setStateData(stateMap)
          setTotalBills(total)
        }
      })
      .catch(error => {
        console.error('Error fetching bill stats:', error)
        // Initialize with empty data if API fails
        const emptyStateMap: Record<string, StateData> = {}
        Object.entries(stateAbbreviations).forEach(([stateName, abbrev]) => {
          emptyStateMap[stateName] = {
            bills: 0,
            abbrev,
            id: abbrev
          }
        })
        setStateData(emptyStateMap)
        setTotalBills(0)
      })
  }, [])

  const getBillColor = (billCount: number) => {
    if (billCount === 0) return '#6B7280'
    if (billCount <= 5) return '#3B82F6'
    if (billCount <= 15) return '#1D4ED8'
    if (billCount <= 25) return '#1E40AF'
    return '#1E3A8A'
  }

  const handleStateClick = (stateName: string) => {
    const state = stateData[stateName]
    if (state) {
      router.push(`/state/${state.abbrev.toLowerCase()}`)
    }
  }

  if (!usTopology) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">Loading Map...</div>
        </div>
      </div>
    )
  }

  const states = feature(usTopology, usTopology.objects.states) as any
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
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Map */}
        <div className="flex-1 relative bg-gray-900">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 975 610"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <rect width="975" height="610" fill="#111827" />
            
            {states.features?.map((state: any) => {
              const stateName = state.properties.NAME
              const stateInfo = stateData[stateName]
              const billCount = stateInfo?.bills || 0
              const pathData = pathGenerator(state)
              
              if (!pathData) return null
              
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
                  {stateInfo && centroid && billCount > 0 && (
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
            <h2 className="text-lg font-semibold text-white">States by Activity</h2>
          </div>

          <div className="p-3">
            <div className="text-xs text-gray-400 px-2 py-2 flex justify-between border-b border-gray-700 mb-2">
              <span>State (Active Bills)</span>
              <span>Status</span>
            </div>

            {Object.entries(stateData)
              .sort(([,a], [,b]) => b.bills - a.bills)
              .filter(([,state]) => state.bills > 0)
              .slice(0, 15)
              .map(([stateName, state]) => (
                <div
                  key={stateName}
                  className="flex items-center justify-between p-2 hover:bg-gray-700 cursor-pointer rounded text-sm transition-colors"
                  onClick={() => router.push(`/state/${state.abbrev.toLowerCase()}`)}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-white font-medium">{stateName} ({state.bills})</div>
                      <div className="text-gray-400 text-xs">Active Legislation</div>
                    </div>
                  </div>
                </div>
              ))}
            
            {Object.values(stateData).every(state => state.bills === 0) && (
              <div className="text-center py-8">
                <p className="text-gray-400">No legislative data yet.</p>
                <p className="text-gray-500 text-sm mt-1">Visit the admin panel to start collecting data.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredState && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-95 text-white p-4 rounded-lg border border-gray-600 shadow-2xl z-50 pointer-events-none">
          <h3 className="font-semibold text-lg">{hoveredState}</h3>
          <p className="text-gray-300 text-sm">
            {stateData[hoveredState]?.bills || 0} active bills
          </p>
          <p className="text-blue-400 text-xs mt-1">Click to explore →</p>
        </div>
      )}
    </div>
  )
}