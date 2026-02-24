'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ScannerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      if (session?.user.role !== 'admin' && session?.user.role !== 'staff') {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );
    
    scannerRef.current = scanner;

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5-qrcode scanner. ", error);
        });
      }
    };
  }, []);

  async function onScanSuccess(decodedText: string, decodedResult: any) {
    if (loading) return;

    // Pause scanning temporarily
    if (scannerRef.current) {
      scannerRef.current.pause();
    }

    setLoading(true);
    setError('');
    setScanResult(null);

    try {
      const res = await fetch('/api/tickets/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: decodedText }),
      });

      const data = await res.json();

      if (res.ok) {
        setScanResult({ success: true, ...data });
      } else {
        setScanResult({ success: false, ...data });
      }
    } catch (err) {
      setError('Network error or server failed');
    } finally {
      setLoading(false);
      // Wait a bit before resuming to avoid accidental double scans
      setTimeout(() => {
         if (scannerRef.current) {
             scannerRef.current.resume();
         }
      }, 2000);
    }
  }

  function onScanFailure(error: any) {
    // handle scan failure, usually better to ignore and keep scanning.
    // console.warn(`Code scan error = ${error}`);
  }

  if (status === 'loading') return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Ticket Scanner</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div id="reader" className="w-full"></div>
      </div>

      {loading && (
        <div className="text-center p-4 bg-blue-50 text-blue-700 rounded mb-4">
          Processing...
        </div>
      )}

      {error && (
        <div className="text-center p-4 bg-red-50 text-red-700 rounded mb-4">
          {error}
        </div>
      )}

      {scanResult && (
        <div className={`text-center p-6 rounded-lg border-2 ${
          scanResult.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
        }`}>
          {scanResult.success ? (
            <>
              <h2 className="text-2xl font-bold text-green-700 mb-2">CHECK-IN SUCCESS</h2>
              <p className="text-lg">Visitor: <strong>{scanResult.ticket.visitorName}</strong></p>
              <p>Package: {scanResult.ticket.packageName}</p>
              <p className="text-sm text-gray-500 mt-2">ID: {scanResult.ticket.id}</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-red-700 mb-2">CHECK-IN FAILED</h2>
              <p className="text-lg font-semibold">{scanResult.message}</p>
              {scanResult.ticket && (
                 <div className="mt-2 text-sm text-gray-600">
                    <p>Visitor: {scanResult.ticket.visitorName}</p>
                    <p>Checked In At: {new Date(scanResult.ticket.checkedInAt).toLocaleString()}</p>
                 </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
