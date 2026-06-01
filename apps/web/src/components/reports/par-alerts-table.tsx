'use client';

import React, { useEffect, useState } from 'react';
import { BellRing, AlertCircle, ArrowDown } from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { ParAlertRow } from '@ims/types';
import { QuickCreatePoDialog } from '@/components/procurement/quick-create-po-dialog';
import { ShoppingCart } from 'lucide-react';

export function ParAlertsTable() {
  const [data, setData] = useState<ParAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { restaurantId } = useAuthStore();
  const [poDialogItem, setPoDialogItem] = useState<{
    id: string;
    name: string;
    suggestedQty: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchAlerts = async () => {
      try {
        if (!restaurantId) return;
        setLoading(true);

        const res = await apiClient<{ data: ParAlertRow[] }>('/reports/par-alerts');

        if (isMounted) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch par alerts', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAlerts();

    return () => {
      isMounted = false;
    };
  }, [restaurantId]);

  return (
    <div className="w-full mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <BellRing className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Par Level Alerts</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Items currently below their defined par levels</p>
        </div>
      </div>
      
      <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl overflow-hidden shadow-sm">
        {loading && data.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 animate-pulse">
            Loading par alerts...
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-4 text-emerald-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h4 className="text-zinc-900 dark:text-white font-medium mb-1">All items are sufficiently stocked</h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No items are currently below par levels.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                  <th className="p-4 px-6 font-medium">Item Name</th>
                  <th className="p-4 px-6 font-medium">Category</th>
                  <th className="p-4 px-6 font-medium text-right">Current Stock</th>
                  <th className="p-4 px-6 font-medium text-right">Par Level</th>
                  <th className="p-4 px-6 font-medium text-right">Deficit</th>
                  <th className="p-4 px-6 font-medium">UOM</th>
                  <th className="p-4 px-6 font-medium">Status</th>
                  <th className="p-4 px-6 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50 text-sm">
                {data.map((row) => (
                  <tr key={row.item.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-4 px-6 text-zinc-900 dark:text-zinc-100 font-medium whitespace-nowrap">
                      {row.item.name}
                    </td>
                    <td className="p-4 px-6 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {row.item.categoryName || '-'}
                    </td>
                    <td className="p-4 px-6 text-right whitespace-nowrap">
                      <span className={cn(
                        "font-mono font-medium",
                        row.currentStock <= 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                      )}>
                        {row.currentStock.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="p-4 px-6 text-right whitespace-nowrap text-zinc-700 dark:text-zinc-300 font-mono">
                      {row.item.effectiveParLevel !== null ? row.item.effectiveParLevel.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="p-4 px-6 text-right whitespace-nowrap">
                      <span className="font-mono font-medium text-red-600 dark:text-red-400 inline-flex items-center">
                        <ArrowDown className="w-3 h-3 mr-1" />
                        {Math.abs(row.varianceFromPar).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="p-4 px-6 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {row.item.inventoryUom}
                    </td>
                    <td className="p-4 px-6 whitespace-nowrap">
                      {row.currentStock <= 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                          Below Par
                        </span>
                      )}
                    </td>
                    <td className="p-4 px-6 text-right whitespace-nowrap">
                      <button
                        className="inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 border border-amber-200 bg-transparent shadow-sm hover:bg-amber-50 hover:text-amber-700 text-amber-600 dark:text-amber-400 dark:border-amber-800/50 dark:hover:bg-amber-900/20 h-8 px-3"
                        onClick={() => setPoDialogItem({
                          id: row.item.id,
                          name: row.item.name,
                          suggestedQty: Math.max(0, Math.ceil(Math.abs(row.varianceFromPar)))
                        })}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Create PO
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <QuickCreatePoDialog 
        isOpen={poDialogItem !== null}
        onClose={() => setPoDialogItem(null)}
        itemId={poDialogItem?.id || ''}
        itemName={poDialogItem?.name || ''}
        suggestedQuantity={poDialogItem?.suggestedQty || 0}
      />
    </div>
  );
}
