'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { InventoryCountBatch } from '@ims/types';
import { ClipboardList, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/use-auth-store';

export function OpenCountsWidget() {
  const { restaurantId } = useAuthStore();
  const { data: batchesResponse, isLoading: loading } = useQuery({
    queryKey: ['counts', restaurantId],
    queryFn: () => apiClient<{ data: InventoryCountBatch[] }>('/inventory/counts?limit=50'),
    enabled: !!restaurantId,
  });

  const batches = batchesResponse?.data.filter(b => b.status === 'OPEN') || [];

  if (loading) return <div className="h-64 animate-pulse bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800" />;

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-xl">
          <ClipboardList className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Active Counts</h3>
      </div>
      
      {batches.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-sm">
          No active counts.
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          {batches.slice(0, 5).map((batch) => (
            <div key={batch.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">Batch #{batch.id.slice(0, 8)}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  Started: {new Date(batch.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="shrink-0 inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 uppercase tracking-wider">
                In Progress
              </span>
            </div>
          ))}
        </div>
      )}
      
      <Link href="/inventory" className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-medium transition-colors">
        Resume Counts
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
