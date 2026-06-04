'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ScrollText, ArrowLeft, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { inventoryApi, type LedgerEntry } from '@/lib/api/inventory';
import { cn } from '@/lib/utils';

const REASON_CODE_COLORS: Record<string, string> = {
  PO_RECEIPT: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  SALES_DEPLETION: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
  COUNT_ADJUSTMENT: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  WASTE: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border-orange-200 dark:border-orange-500/20',
  TRANSFER_OUT: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  TRANSFER_IN: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
  PREP_CONSUMPTION: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
  PREP_PRODUCTION: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400 border-teal-200 dark:border-teal-500/20',
};

const PAGE_SIZE = 50;

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (newOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryApi.getLedger(PAGE_SIZE, newOffset);
      setEntries(res.data ?? []);
      setHasMore((res.data?.length ?? 0) === PAGE_SIZE);
      setOffset(newOffset);
    } catch (err) {
      setError('Failed to load ledger entries. Check that you are authenticated.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(0); }, [load]);

  const page = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] bg-[url('/grid.svg')] dark:bg-[url('/grid-dark.svg')] bg-center selection:bg-indigo-500/30">
      <main className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto space-y-10">

          {/* Header */}
          <header className="space-y-6">
            <Link
              href="/inventory"
              className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Inventory
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-6">
                  <ScrollText className="w-4 h-4" />
                  <span>Inventory Ledger</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight mb-4">
                  Transaction History
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
                  Immutable append-only log of all stock movements — receipts, depletions, counts, transfers, waste, and prep.
                </p>
              </div>
              <button
                onClick={() => load(offset)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                Refresh
              </button>
            </div>
          </header>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            {loading && entries.length === 0 ? (
              <div className="flex items-center justify-center py-24 text-zinc-400 dark:text-zinc-500">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                Loading ledger…
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <ScrollText className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">No ledger entries found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="text-left px-6 py-4 font-semibold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Timestamp</th>
                      <th className="text-left px-6 py-4 font-semibold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Reason</th>
                      <th className="text-left px-6 py-4 font-semibold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Item</th>
                      <th className="text-right px-6 py-4 font-semibold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Qty Change</th>
                      <th className="text-left px-6 py-4 font-semibold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                    {entries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300 font-mono text-xs whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border',
                            REASON_CODE_COLORS[entry.reasonCode] ?? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                          )}>
                            {entry.reasonCode.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-700 dark:text-zinc-200 font-medium">
                          {entry.itemName ?? <span className="text-zinc-400 font-mono text-xs">{entry.itemId.slice(0, 8)}…</span>}
                        </td>
                        <td className={cn(
                          'px-6 py-4 text-right font-semibold tabular-nums',
                          entry.changeAmount > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        )}>
                          {entry.changeAmount > 0 ? '+' : ''}{entry.changeAmount.toFixed(3)}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 dark:text-zinc-500 font-mono text-xs">
                          {entry.referenceId ? entry.referenceId.slice(0, 12) + '…' : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && entries.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Page {page} · Showing {entries.length} entries
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => load(Math.max(0, offset - PAGE_SIZE))}
                    disabled={offset === 0 || loading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => load(offset + PAGE_SIZE)}
                    disabled={!hasMore || loading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
