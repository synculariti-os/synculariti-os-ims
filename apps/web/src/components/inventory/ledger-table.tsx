'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { History, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { cn } from '@/lib/utils';

interface LedgerEntry {
  id: string;
  createdAt: string;
  reasonCode: string;
  changeAmount: number;
  referenceId: string | null;
  itemId: string;
  itemName: string;
  baseUom: string;
}

export function LedgerTable() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { restaurantId } = useAuthStore();

  useEffect(() => {
    let isMounted = true;
    
    const fetchLedger = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !restaurantId) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/inventory/ledger?limit=100`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'x-restaurant-id': restaurantId,
          },
        });

        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            setEntries(json.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch ledger', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLedger();
    const intervalId = setInterval(fetchLedger, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [restaurantId]);

  return (
    <div className="w-full mt-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Transaction Ledger</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Immutable history of stock movements</p>
        </div>
      </div>
      
      <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl overflow-hidden shadow-sm">
        {loading && entries.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 animate-pulse">
            Loading ledger history...
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-400">
              <History className="w-8 h-8 opacity-50" />
            </div>
            <h4 className="text-zinc-900 dark:text-white font-medium mb-1">No transaction history</h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Ledger entries will appear here when stock changes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                  <th className="p-4 px-6 font-medium">Timestamp</th>
                  <th className="p-4 px-6 font-medium">Item</th>
                  <th className="p-4 px-6 font-medium">Change</th>
                  <th className="p-4 px-6 font-medium">Reason</th>
                  <th className="p-4 px-6 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50 text-sm">
                  {entries.map((entry) => {
                  const isNegative = entry.changeAmount < 0;
                  return (
                    <tr key={entry.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                      <td className="p-4 px-6 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString(undefined, { 
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit'
                        })}
                      </td>
                      <td className="p-4 px-6 text-zinc-900 dark:text-zinc-100 font-medium whitespace-nowrap">
                        {entry.itemName}
                        <span className="ml-2 text-xs text-zinc-500 font-normal">({entry.baseUom})</span>
                      </td>
                      <td className="p-4 px-6 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center font-mono font-medium",
                          isNegative ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                        )}>
                          {isNegative ? <ArrowDownRight className="w-3.5 h-3.5 mr-1" /> : <ArrowUpRight className="w-3.5 h-3.5 mr-1" />}
                          {isNegative ? '' : '+'}{Number(entry.changeAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {entry.reasonCode}
                        </span>
                      </td>
                      <td className="p-4 px-6 text-zinc-500 dark:text-zinc-400 whitespace-nowrap text-xs font-mono">
                        {entry.referenceId ? entry.referenceId.substring(0, 8) + '...' : '-'}
                      </td>
                    </tr>
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
