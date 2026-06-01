'use client';

import React, { useEffect, useState } from 'react';
import { InventoryTransfer } from '@ims/types';
import { apiClient } from '@/lib/api-client';

export function TransfersTable() {
  const [transfers, setTransfers] = useState<InventoryTransfer[]>([]);
  const [direction, setDirection] = useState<'IN' | 'OUT'>('OUT');
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransfers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient<InventoryTransfer[]>(`/inventory/transfers?direction=${direction}`);
      setTransfers(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [direction]);

  const handleAction = async (id: string, action: 'dispatch' | 'receive' | 'cancel') => {
    try {
      await apiClient(`/inventory/transfers/${id}/${action}`, { method: 'POST' });
      fetchTransfers();
    } catch (error: any) {
      alert(`Failed to ${action} transfer: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm ${direction === 'OUT' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'}`}
          onClick={() => setDirection('OUT')}
        >
          Outgoing Transfers
        </button>
        <button
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm ${direction === 'IN' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'}`}
          onClick={() => setDirection('IN')}
        >
          Incoming Transfers
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Item ID</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{direction === 'OUT' ? 'Destination' : 'Origin'}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 text-sm">Loading transfers...</td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 text-sm">
                    No {direction === 'OUT' ? 'outgoing' : 'incoming'} transfers found.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white truncate max-w-[150px]">{t.itemId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-semibold">{t.qty}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 truncate max-w-[150px]">
                      {direction === 'OUT' ? t.destinationRestaurantId : t.originRestaurantId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${t.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        t.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        t.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-3">
                      {direction === 'OUT' && t.status === 'PENDING' && (
                        <button onClick={() => handleAction(t.id, 'dispatch')} className="text-blue-600 hover:text-blue-800 font-medium">Dispatch</button>
                      )}
                      {direction === 'IN' && t.status === 'IN_TRANSIT' && (
                        <button onClick={() => handleAction(t.id, 'receive')} className="text-green-600 hover:text-green-800 font-medium">Receive</button>
                      )}
                      {(t.status === 'PENDING' || t.status === 'IN_TRANSIT') && (
                        <button onClick={() => handleAction(t.id, 'cancel')} className="text-red-600 hover:text-red-800 font-medium">Cancel</button>
                      )}
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
