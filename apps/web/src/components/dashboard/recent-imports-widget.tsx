'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { SalesImportBatch } from '@ims/types';
import { FileSpreadsheet, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function RecentImportsWidget() {
  const [batches, setBatches] = useState<SalesImportBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<{ data: SalesImportBatch[] }>('/sales-imports?limit=5')
      .then((res) => {
        setBatches(res.data.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-64 animate-pulse bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800" />;

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-xl">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Recent POS Imports</h3>
      </div>
      
      {batches.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-sm">
          No recent imports.
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          {batches.map((batch) => (
            <div key={batch.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  {new Date(batch.businessDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(batch.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider ${
                batch.status === 'COMPLETED' 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                  : batch.status === 'FAILED'
                  ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                  : 'bg-zinc-50 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400'
              }`}>
                {batch.status}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <Link href="/sales/import" className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-medium transition-colors">
        View All Imports
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
