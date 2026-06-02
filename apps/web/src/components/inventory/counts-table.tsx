'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InventoryCountBatch } from '@ims/types';
import { apiClient } from '@/lib/api-client';
import { ClipboardList, Plus, ChevronRight, CheckCircle, Clock } from 'lucide-react';

export function CountsTable() {
  const router = useRouter();
  const [batches, setBatches] = useState<InventoryCountBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  const fetchBatches = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient<{ data: InventoryCountBatch[] }>('/inventory/counts');
      setBatches(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleStartBatch = async () => {
    try {
      setIsStarting(true);
      const batch = await apiClient<InventoryCountBatch>('/inventory/counts/start', {
        method: 'POST',
      });
      router.push(`/inventory/counts/${batch.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to start count batch');
    } finally {
      setIsStarting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50';
      case 'CLOSED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'CLOSED': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-end items-center gap-4">
        <button 
          onClick={handleStartBatch}
          disabled={isStarting}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-emerald-200 dark:shadow-emerald-900/20"
        >
          {isStarting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Start New Count
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Batch ID</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date Started</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500 text-sm">Loading count batches...</td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-sm flex flex-col items-center justify-center gap-2">
                    <ClipboardList className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                    <span>No inventory counts found</span>
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                          <ClipboardList className="w-4 h-4" />
                        </div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-white font-mono">{batch.id.split('-')[0]}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${getStatusBadge(batch.status)}`}>
                        {getStatusIcon(batch.status)}
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                      {new Date(batch.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => router.push(`/inventory/counts/${batch.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                      >
                        {batch.status === 'OPEN' ? 'Continue Count' : 'View Details'}
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
