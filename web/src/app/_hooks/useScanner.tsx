// hooks/useScanner.ts
import { useState } from 'react';

interface ScanResult {
  success: boolean;
  url: string;
  scan_summary: {
    files_scanned: number;
    secrets_found: number;
    findings_by_type: Record<string, number>;
  };
  results: {
    summary: string;
    findings: string | null;
    json_data: any;
  };
}

export function useScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);

  // Quick scan (synchronous)
  const quickScan = async (url: string, maxFiles: number = 100) => {
    setIsScanning(true);
    setError(null);
    setScanResult(null);
    
    try {
      const response = await fetch('http://localhost:5001/scan/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, max_files: maxFiles })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setScanResult(data);
        return { success: true, data };
      } else {
        throw new Error(data.error || 'Scan failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Scan failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsScanning(false);
    }
  };

  // Async scan (returns scan ID)
  const startAsyncScan = async (url: string, maxFiles: number = 100) => {
    setIsScanning(true);
    setError(null);
    setScanId(null);
    
    try {
      const response = await fetch('http://localhost:5001/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, max_files: maxFiles })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setScanId(data.scan_id);
        return { success: true, scanId: data.scan_id };
      } else {
        throw new Error(data.error || 'Failed to start scan');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start scan';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsScanning(false);
    }
  };

  // Check scan status
  const checkScanStatus = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5001/scan/status/${id}`);
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to check status:', err);
      return null;
    }
  };

  // Get scan results
  const getScanResults = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5001/scan/results/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setScanResult(data);
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get results';
      return { success: false, error: errorMessage };
    }
  };

  return {
    isScanning,
    scanResult,
    error,
    scanId,
    quickScan,
    startAsyncScan,
    checkScanStatus,
    getScanResults,
    reset: () => {
      setScanResult(null);
      setError(null);
      setScanId(null);
    }
  };
}