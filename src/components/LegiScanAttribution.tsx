// src/components/LegiScanAttribution.tsx
export default function LegiScanAttribution() {
  return (
    <div className="bg-slate-800 border-t border-slate-700 py-4 px-6 text-center">
      <p className="text-slate-400 text-sm">
        Legislative data provided by{' '}
        <a 
          href="https://legiscan.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          LegiScan
        </a>
        {' '}under{' '}
        <a 
          href="https://creativecommons.org/licenses/by/4.0/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          Creative Commons Attribution 4.0
        </a>
      </p>
    </div>
  )
}