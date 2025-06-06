'use client'

import { useState, useEffect } from 'react'
import { getAvailableStates } from '@/lib/scraper'

interface JobStatus {
  jobId: string
  state: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  progress?: {
    billsFound: number
    billsProcessed: number
    billsSummarized: number
  }
  errors?: string[]
  startedAt?: string
  completedAt?: string
}

interface BillStats {
  totalBills: number
  byState: Array<{ stateId: string; _count: number }>
  byStatus: Array<{ status: string; _count: number }>
}

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<JobStatus[]>([])
  const [stats, setStats] = useState<BillStats | null>(null)
  const [selectedState, setSelectedState] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const availableStates = getAvailableStates()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/bills?stats=true')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const startScraping = async () => {
    if (!selectedState) {
      setMessage('Please select a state')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state: selectedState }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`Scraping job started for ${selectedState}`)
        // Add job to the list
        const newJob: JobStatus = {
          jobId: data.jobId,
          state: data.state,
          status: 'PENDING'
        }
        setJobs(prev => [newJob, ...prev])
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('Failed to start scraping job')
      console.error('Error starting scraping:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/scrape?jobId=${jobId}`)
      const data = await response.json()
      
      if (response.ok) {
        setJobs(prev => prev.map(job => 
          job.jobId === jobId ? { ...job, ...data } : job
        ))
      }
    } catch (error) {
      console.error('Error checking job status:', error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">PolicyByte Admin Dashboard</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold mb-2">Total Bills</h3>
            <p className="text-3xl font-bold text-blue-400">
              {stats?.totalBills || 0}
            </p>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold mb-2">States Covered</h3>
            <p className="text-3xl font-bold text-green-400">
              {stats?.byState?.length || 0}
            </p>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold mb-2">Active Jobs</h3>
            <p className="text-3xl font-bold text-yellow-400">
              {jobs.filter(job => job.status === 'RUNNING').length}
            </p>
          </div>
        </div>

        {/* Scraping Controls */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-8">
          <h2 className="text-xl font-semibold mb-4">Start New Scraping Job</h2>
          
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select State
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a state...</option>
                {availableStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={startScraping}
              disabled={isLoading || !selectedState}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-md font-medium transition-colors"
            >
              {isLoading ? 'Starting...' : 'Start Scraping'}
            </button>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded ${
              message.includes('Error') ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Jobs List */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Recent Scraping Jobs</h2>
          
          {jobs.length === 0 ? (
            <p className="text-slate-400">No scraping jobs yet. Start one above!</p>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.jobId}
                  className="border border-slate-600 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{job.state}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.status === 'COMPLETED' ? 'bg-green-900 text-green-300' :
                        job.status === 'RUNNING' ? 'bg-yellow-900 text-yellow-300' :
                        job.status === 'FAILED' ? 'bg-red-900 text-red-300' :
                        'bg-slate-600 text-slate-300'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => checkJobStatus(job.jobId)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Refresh Status
                    </button>
                  </div>
                  
                  {job.progress && (
                    <div className="text-sm text-slate-400">
                      Found: {job.progress.billsFound} | 
                      Processed: {job.progress.billsProcessed} | 
                      Summarized: {job.progress.billsSummarized}
                    </div>
                  )}
                  
                  {job.errors && job.errors.length > 0 && (
                    <div className="mt-2 text-sm text-red-400">
                      Errors: {job.errors.join(', ')}
                    </div>
                  )}
                  
                  <div className="text-xs text-slate-500 mt-2">
                    Job ID: {job.jobId}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bill Status Breakdown */}
        {stats?.byStatus && (
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mt-8">
            <h2 className="text-xl font-semibold mb-4">Bills by Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.byStatus.map((statusGroup) => (
                <div key={statusGroup.status} className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {statusGroup._count}
                  </div>
                  <div className="text-sm text-slate-400">
                    {statusGroup.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}