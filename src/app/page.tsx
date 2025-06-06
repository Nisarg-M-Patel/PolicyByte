import Map from '@/components/Map'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Policy<span className="text-blue-400">Byte</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Bite-sized summaries of legislation across America. 
            Click any state to explore current bills and policy changes.
          </p>
        </header>
        
        <div className="flex justify-center">
          <Map />
        </div>
      </div>
    </main>
  )
}