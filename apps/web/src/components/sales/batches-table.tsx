'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertTriangle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { SalesImportBatch, ImportStatus } from '@ims/types';
import { useAuthStore } from '@/store/use-auth-store';
import { SmartMappingReview } from './unmapped-items-panel';

const statusConfig: Record<ImportStatus, { icon: React.ElementType, class: string, label: string }> = {
  PENDING: { icon: Clock, class: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400', label: 'Pending' },
  PROCESSING: { icon: Loader2, class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 animate-pulse', label: 'Processing' },
  COMPLETED: { icon: CheckCircle2, class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400', label: 'Completed' },
  FAILED: { icon: AlertTriangle, class: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400', label: 'Failed' },
};

export function BatchesTable({ initialBatches = [] }: { initialBatches?: SalesImportBatch[] }) {
  const [batches, setBatches] = useState<SalesImportBatch[]>(initialBatches);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const { restaurantId } = useAuthStore();

  useEffect(() => {
    let isMounted = true;
    
    const fetchBatches = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !restaurantId) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/sales-imports?limit=20`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'x-restaurant-id': restaurantId,
          },
        });

        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            setBatches(json.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch batches', error);
      }
    };

    fetchBatches();

    // Poll every 3 seconds
    const intervalId = setInterval(fetchBatches, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [restaurantId]);

  return (
    <div className="w-full mt-10">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Recent Uploads</h3>
      
      <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl overflow-hidden shadow-sm">
        {batches.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
            No past uploads found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                  <th className="p-4 px-6 font-medium">Date / Time</th>
                  <th className="p-4 px-6 font-medium">Business Date</th>
                  <th className="p-4 px-6 font-medium">Status</th>
                  <th className="p-4 px-6 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50 text-sm">
                {batches.map((batch) => {
                  const StatusIcon = statusConfig[batch.status].icon;
                  return (
                    <React.Fragment key={batch.id}>
                      <tr className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                        <td className="p-4 px-6 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                        {new Date(batch.createdAt).toLocaleString(undefined, { 
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                        })}
                      </td>
                      <td className="p-4 px-6 text-zinc-700 dark:text-zinc-300 font-medium whitespace-nowrap">
                        {batch.businessDate || '-'}
                      </td>
                      <td className="p-4 px-6 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
                          statusConfig[batch.status].class
                        )}>
                          <StatusIcon className={cn(
                            "w-3.5 h-3.5 mr-1.5",
                            batch.status === 'PROCESSING' && "animate-spin"
                          )} />
                          {statusConfig[batch.status].label}
                        </span>
                      </td>
                      <td className="p-4 px-6 text-zinc-500 dark:text-zinc-400 max-w-[200px] truncate">
                        {batch.status === 'FAILED' ? (
                          <span className="text-red-500/90 dark:text-red-400" title={batch.errorMessage || ''}>
                            {batch.errorMessage || 'Unknown error'}
                          </span>
                        ) : batch.status === 'COMPLETED' ? (
                          <button
                            onClick={() => setExpandedBatchId(expandedBatchId === batch.id ? null : batch.id)}
                            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium text-sm transition-colors"
                          >
                            View & Map Items
                            {expandedBatchId === batch.id ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                          </button>
                        ) : (
                          <span className="text-xs font-mono opacity-60">
                            {batch.id.substring(0, 8)}...
                          </span>
                        )}
                      </td>
                    </tr>
                    {expandedBatchId === batch.id && (
                      <tr key={`${batch.id}-expanded`}>
                        <td colSpan={4} className="p-0 border-b-0">
                          <div className="bg-zinc-50/50 dark:bg-zinc-900/50 p-4 sm:p-6 border-b border-zinc-200/50 dark:border-zinc-800/50">
                            <SmartMappingReview 
                              batchId={batch.id} 
                              onResolved={() => {
                                // Close panel on resolve
                                setExpandedBatchId(null);
                              }} 
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
