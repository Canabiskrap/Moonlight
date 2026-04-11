'use client';
import React, { useState, useEffect } from 'react';
import { runAutoScanner, DiagnosticResult, calculateHealthScore } from '@/lib/diagnostics';
import AdminNav from '@/components/AdminNav';
import { Activity, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function DiagnosticsPage() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);

  const runDiagnostics = async () => {
    setLoading(true);
    const scanResults = await runAutoScanner();
    setResults(scanResults);
    setScore(calculateHealthScore(scanResults));
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white">
      <AdminNav />
      <main className="flex-1 p-10 mr-64">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-black">نظام التشخيص الذكي</h1>
          <button 
            onClick={runDiagnostics}
            disabled={loading}
            className="flex items-center gap-2 bg-[#7c5cfc] px-6 py-3 rounded-2xl font-bold hover:bg-[#6c4ceb] transition-all"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            {loading ? 'جاري الفحص...' : 'بدء الفحص الشامل'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-[#1a1a24] p-6 rounded-3xl border border-white/5">
            <h3 className="text-gray-500 font-bold mb-2">النتيجة الإجمالية</h3>
            <p className="text-5xl font-black text-[#7c5cfc]">{score}%</p>
          </div>
        </div>

        <div className="bg-[#1a1a24] rounded-3xl border border-white/5 p-8">
          <h2 className="text-2xl font-black mb-6">نتائج الفحص</h2>
          <div className="space-y-4">
            {results.map((result) => (
              <div key={result.id} className="flex items-center justify-between p-4 bg-[#0a0a0f] rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  {result.status === 'passed' ? <CheckCircle2 className="text-[#00e676]" /> : <XCircle className="text-[#ff1744]" />}
                  <span className="font-bold">{result.name}</span>
                </div>
                <span className="text-sm text-gray-400">{result.message}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
