'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InventoryCountBatch, InventoryCountRow, ItemWithOverride } from '@ims/types';
import { apiClient } from '@/lib/api-client';
import { ClipboardList, Save, CheckCircle, ChevronLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ActiveCountSessionPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params?.id as string;

  const [batch, setBatch] = useState<InventoryCountBatch | null>(null);
  const [rows, setRows] = useState<InventoryCountRow[]>([]);
  const [items, setItems] = useState<Record<string, ItemWithOverride>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local state for actual counts before they are saved to the backend
  const [actualCounts, setActualCounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!batchId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch batch details and items in parallel
        const [batchRes, itemsRes] = await Promise.all([
          apiClient<{ batch: InventoryCountBatch; rows: InventoryCountRow[] }>(`/inventory/counts/${batchId}`),
          apiClient<{ data: ItemWithOverride[] }>('/items?limit=1000')
        ]);

        setBatch(batchRes.batch);
        setRows(batchRes.rows);
        
        // Convert rows to local state map
        const initialCounts: Record<string, string> = {};
        batchRes.rows.forEach(r => {
          if (r.actualQty !== null && r.actualQty !== undefined) {
            initialCounts[r.id] = r.actualQty.toString();
          }
        });
        setActualCounts(initialCounts);

        // Convert items to map
        const itemsMap: Record<string, ItemWithOverride> = {};
        itemsRes.data.forEach(item => {
          itemsMap[item.id] = item;
        });
        setItems(itemsMap);
      } catch (err: any) {
        setError(err.message || 'Failed to load count session');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [batchId]);

  const handleSaveRow = async (rowId: string) => {
    const value = actualCounts[rowId];
    if (value === undefined || value === '') return;

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return;

    try {
      setIsSaving(true);
      await apiClient(`/inventory/counts/${batchId}/rows/${rowId}`, {
        method: 'PATCH',
        body: { actualQty: numValue }
      });
      
      // Update local row state to reflect saved value
      setRows(prev => prev.map(r => r.id === rowId ? { ...r, actualQty: numValue } : r));
    } catch (err: any) {
      alert(err.message || 'Failed to save count');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseBatch = async () => {
    if (!batch) return;
    
    // Check if any rows are missing actualQty in local state
    const missingCounts = rows.some(r => actualCounts[r.id] === undefined || actualCounts[r.id] === '');
    if (missingCounts) {
      if (!confirm('Some items have not been counted. They will be recorded with their expected quantities (variance of 0). Do you want to proceed?')) {
        return;
      }
    }

    try {
      setIsClosing(true);
      await apiClient(`/inventory/counts/${batchId}/close`, {
        method: 'POST',
        body: { version: batch.version }
      });
      router.push('/inventory/counts');
    } catch (err: any) {
      setError(err.message || 'Failed to close batch');
    } finally {
      setIsClosing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl max-w-lg text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-xl font-bold mb-2">Error Loading Session</h2>
          <p>{error || 'Count batch not found'}</p>
          <Link href="/inventory/counts" className="mt-6 inline-block underline">Return to Counts</Link>
        </div>
      </div>
    );
  }

  const isOpen = batch.status === 'OPEN';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 pb-32">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <Link href="/inventory/counts" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Inventory Counts
        </Link>

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                <ClipboardList className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
                Batch {batch.id.split('-')[0]}
              </h1>
              <span className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-md",
                isOpen ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
              )}>
                {batch.status}
              </span>
            </div>
            <p className="text-sm text-zinc-500">
              Started on {new Date(batch.createdAt).toLocaleString()}
            </p>
          </div>
          
          {isOpen && (
            <button
              onClick={handleCloseBatch}
              disabled={isClosing}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {isClosing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Reconcile & Close Batch
            </button>
          )}
        </header>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Item</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Expected Qty</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actual Qty</th>
                  {isOpen && <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {rows.map(row => {
                  const item = items[row.itemId];
                  const itemName = item ? item.name : `Unknown Item (${row.itemId.split('-')[0]})`;
                  const uom = item ? item.inventoryUom : '';
                  const hasUnsavedChanges = actualCounts[row.id] !== undefined && actualCounts[row.id] !== row.actualQty?.toString();
                  const isSaved = row.actualQty !== null;

                  return (
                    <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-zinc-900 dark:text-white">{itemName}</div>
                        <div className="text-xs text-zinc-500">{uom}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                          {row.expectedQty.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isOpen ? (
                          <div className="flex items-center gap-2 max-w-xs">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={actualCounts[row.id] ?? ''}
                              onChange={(e) => setActualCounts(prev => ({ ...prev, [row.id]: e.target.value }))}
                              onBlur={() => {
                                if (hasUnsavedChanges) handleSaveRow(row.id);
                              }}
                              className="w-24 px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-mono"
                              placeholder="0.00"
                            />
                            {isSaved && !hasUnsavedChanges && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                          </div>
                        ) : (
                          <span className={cn("text-sm font-mono font-semibold", row.actualQty !== row.expectedQty ? "text-amber-600" : "text-zinc-600 dark:text-zinc-400")}>
                            {row.actualQty !== null ? row.actualQty.toFixed(2) : '-'}
                          </span>
                        )}
                      </td>
                      {isOpen && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleSaveRow(row.id)}
                            disabled={!hasUnsavedChanges || isSaving}
                            className="inline-flex items-center justify-center p-2 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Save Row"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
