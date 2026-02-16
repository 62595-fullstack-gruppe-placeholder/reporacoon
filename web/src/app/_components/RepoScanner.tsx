'use client';

import { useState } from 'react';
import { useScanner } from '../_hooks/useScanner';
import Image from 'next/image';

interface RepoScannerProps {
  initialUrl?: string;
  onScanComplete?: (result: any) => void;
}

export default function RepoScanner({ initialUrl = '', onScanComplete }: RepoScannerProps) {
  const [url, setUrl] = useState(initialUrl);
  const [scanMode, setScanMode] = useState<'quick' | 'deep'>('quick');
  const [showResults, setShowResults] = useState(false);
  
  const { 
    isScanning, 
    scanResult, 
    error, 
    scanId,
    quickScan, 
    startAsyncScan,
    getScanResults,
    reset 
  } = useScanner();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowResults(true);
    
    if (scanMode === 'quick') {
      await quickScan(url);
    } else {
      const result = await startAsyncScan(url);
      if (result.success && result.scanId) {
        // For deep scans, poll for results
        pollForResults(result.scanId);
      }
    }
  };

  const pollForResults = async (id: string) => {
    const interval = setInterval(async () => {
      const status = await getScanResults(id);
      if (status.success) {
        clearInterval(interval);
      }
    }, 2000); // Check every 2 seconds
  };

  const getSeverityColor = (type: string) => {
    if (type.includes('Password') || type.includes('Secret')) return 'text-red-600';
    if (type.includes('Key') || type.includes('Token')) return 'text-orange-600';
    return 'text-yellow-600';
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="field">
        <Image src="/searchIcon.svg" alt="" width={20} height={20} />
        
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            reset();
            setShowResults(false);
          }}
          placeholder="Paste a GitHub URL"
          className="fieldText flex-1 min-w-0 w-full bg-transparent outline-none truncate"
          disabled={isScanning}
        />
        
        <select
          value={scanMode}
          onChange={(e) => setScanMode(e.target.value as 'quick' | 'deep')}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
          disabled={isScanning}
        >
          <option value="quick">Quick Scan</option>
          <option value="deep">Deep Scan</option>
        </select>
        
        <button
          type="submit"
          className="btn bg-button-main whitespace-nowrap disabled:opacity-50"
          disabled={isScanning || !url.trim()}
        >
          {isScanning ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              {scanMode === 'quick' ? 'Scanning...' : 'Starting...'}
            </span>
          ) : 'Start Scanning'}
        </button>
      </form>

      {/* Scan Results */}
      {showResults && (scanResult || error || scanId) && (
        <div className="mt-6 border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-semibold">Scan Results</h3>
          </div>

          {/* Content */}
          <div className="p-4">
            {isScanning && (
              <div className="text-center py-8">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p className="text-gray-600">Scanning repository... This may take a moment.</p>
              </div>
            )}

            {error && !isScanning && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {scanId && !scanResult && !isScanning && (
              <div className="bg-blue-50 text-blue-700 p-4 rounded-lg">
                <p className="font-medium">Deep Scan Started</p>
                <p className="text-sm">Scan ID: {scanId}</p>
                <p className="text-sm mt-2">You can check status later at:</p>
                <code className="text-xs bg-blue-100 px-2 py-1 rounded mt-1 inline-block">
                  GET /scan/status/{scanId}
                </code>
              </div>
            )}

            {scanResult && scanResult.success && (
              <div>
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold">{scanResult.scan_summary.files_scanned}</div>
                    <div className="text-xs text-gray-600">Files Scanned</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold">{scanResult.scan_summary.secrets_found}</div>
                    <div className="text-xs text-gray-600">Secrets Found</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold">
                      {Object.keys(scanResult.scan_summary.findings_by_type).length}
                    </div>
                    <div className="text-xs text-gray-600">Secret Types</div>
                  </div>
                </div>

                {/* Findings by Type */}
                {scanResult.scan_summary.secrets_found > 0 ? (
                  <div>
                    <h4 className="font-medium mb-3">Detected Secrets:</h4>
                    <div className="space-y-3">
                      {Object.entries(scanResult.scan_summary.findings_by_type).map(([type, count]) => (
                        <div key={type} className="border rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <span className={`font-medium ${getSeverityColor(type)}`}>
                              {type}
                            </span>
                            <span className="bg-gray-100 px-2 py-1 rounded-full text-sm">
                              {count} found
                            </span>
                          </div>
                          
                          {/* Show first finding as example */}
                          {scanResult.results.json_data?.findings[type]?.[0] && (
                            <div className="mt-2 text-sm text-gray-600">
                              <p className="truncate">
                                📁 {scanResult.results.json_data.findings[type][0].file_path}
                              </p>
                              <p className="text-xs mt-1">
                                Line {scanResult.results.json_data.findings[type][0].line_number}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* View Full Report Button */}
                    <button
                      onClick={() => window.open(scanResult.results.json_data?.scan_info?.session_dir)}
                      className="mt-4 w-full bg-gray-900 text-white py-2 rounded-lg text-sm hover:bg-gray-800 transition"
                    >
                      View Full Report
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-4">🔒</div>
                    <p className="text-gray-600">No secrets found! Your repository looks clean.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}