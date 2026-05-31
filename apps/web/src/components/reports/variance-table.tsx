'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { ItemWithOverride, VarianceReportRow } from '@ims/types';

interface PopulatedVarianceRow extends VarianceReportRow {
  itemName: string;
  inventoryUom: string;
}

export function VarianceTable() {
  const [data, setData] = useState<PopulatedVarianceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { restaurantId } = useAuthStore();

  useEffect(() => {
    let isMounted = true;
    
    const fetchVariance = async () => {
      try {
        if (!restaurantId) return;
        setLoading(true);

        const [varianceRes, itemsRes] = await Promise.all([
          apiClient<{ data: VarianceReportRow[] }>('/reports/variance'),
          apiClient<{ data: ItemWithOverride[] }>('/items?limit=1000')
        ]);

        if (isMounted) {
          // Join the item details to the variance rows
          const itemsMap = new Map(itemsRes.data.map(item => [item.id, item]));
          
          const populated = varianceRes.data.map(row => {
            const item = itemsMap.get(row.itemId);
            return {
              ...row,
              itemName: item?.name || 'Unknown Item',
              inventoryUom: item?.inventoryUom || '',
            };
          });

          setData(populated);
        }
      } catch (error) {
        console.error('Failed to fetch variance data', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVariance();

    return () => {
      isMounted = false;
    };
  }, [restaurantId]);

  return (
    <div className="w-full mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Variance Analytics</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Theoretical vs Actual Inventory Usage</p>
        </div>
      </div>
      
      <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl overflow-hidden shadow-sm">
        {loading && data.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 animate-pulse">
            Loading variance data...
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-400">
              <BarChart3 className="w-8 h-8 opacity-50" />
            </div>
            <h4 className="text-zinc-900 dark:text-white font-medium mb-1">No variance data available</h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Run an End-of-Day snapshot or perform counts to generate data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                  <th className="p-4 px-6 font-medium">Month</th>
                  <th className="p-4 px-6 font-medium">Item Name</th>
                  <th className="p-4 px-6 font-medium text-right">Theoretical Qty</th>
                  <th className="p-4 px-6 font-medium text-right">Actual Qty</th>
                  <th className="p-4 px-6 font-medium text-right">Unexplained Variance</th>
                  <th className="p-4 px-6 font-medium">UOM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50 text-sm">
                {data.map((row, idx) => (
                  <tr key={`${row.itemId}-${row.reportingMonth}-${idx}`} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-4 px-6 text-zinc-900 dark:text-zinc-100 font-medium whitespace-nowrap">
                      {row.reportingMonth}
                    </td>
                    <td className="p-4 px-6 text-zinc-900 dark:text-zinc-100 font-medium whitespace-nowrap">
                      {row.itemName}
                    </td>
                    <td className="p-4 px-6 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-mono">
                      {row.theoreticalQty !== null ? row.theoreticalQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="p-4 px-6 text-right whitespace-nowrap text-zinc-700 dark:text-zinc-300 font-mono">
                      {row.actualQty !== null ? row.actualQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="p-4 px-6 text-right whitespace-nowrap">
                      <span className={cn(
                        "font-mono font-medium",
                        row.unexplainedVarianceQty && row.unexplainedVarianceQty < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                      )}>
                        {row.unexplainedVarianceQty !== null ? row.unexplainedVarianceQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                      </span>
                    </td>
                    <td className="p-4 px-6 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {row.inventoryUom}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
