'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ItemWithOverride, PrepPlanResponse, PrepPlanLine } from '@ims/types';
import { apiClient } from '@/lib/api-client';
import { Calculator, ArrowLeft, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

export default function PlanPrepPage() {
  const router = useRouter();
  const [items, setItems] = useState<ItemWithOverride[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [targetYield, setTargetYield] = useState<number>(1);
  const [plan, setPlan] = useState<PrepPlanResponse | null>(null);
  
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await apiClient<{ data: ItemWithOverride[] }>('/items?limit=1000');
        setItems(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load items');
      } finally {
        setIsLoadingItems(false);
      }
    };
    fetchItems();
  }, []);

  const handlePlan = async () => {
    if (!selectedItemId || targetYield <= 0) return;
    
    setIsPlanning(true);
    setError(null);
    try {
      const res = await apiClient<{ data: PrepPlanResponse }>(`/inventory/prep/plan?itemId=${selectedItemId}&targetYield=${targetYield}`);
      setPlan(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate prep plan. Does this item have a recipe?');
      setPlan(null);
    } finally {
      setIsPlanning(false);
    }
  };

  // Debounce the planning call
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (selectedItemId && targetYield > 0) {
        handlePlan();
      } else {
        setPlan(null);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [selectedItemId, targetYield]);

  const handleCommit = async () => {
    if (!plan || !plan.isPossible) return;
    
    setIsSubmitting(true);
    try {
      await apiClient('/inventory/prep', {
        method: 'POST',
        body: {
          prepItemId: plan.prepItemId,
          yieldQtyProduced: plan.targetYield
        }
      });
      router.push('/inventory/prep');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to log prep batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.back()}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                <Calculator className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Plan Production Batch
              </h1>
            </div>
          </div>
        </header>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm h-fit">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Batch Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target Item</label>
                <select 
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  disabled={isLoadingItems}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Select an item...</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.inventoryUom})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target Yield Quantity</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  value={targetYield || ''}
                  onChange={(e) => setTargetYield(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">BOM Requirements</h2>
                {isPlanning && <span className="text-sm text-zinc-500 animate-pulse">Calculating...</span>}
              </div>
              
              {!plan ? (
                <div className="p-12 text-center text-zinc-500">
                  Select an item and quantity to preview required ingredients.
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {plan.ingredients.map((ing) => (
                      <li key={ing.itemId} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white">{ing.itemName}</p>
                          <p className="text-sm text-zinc-500">Stock: {ing.currentStock.toFixed(2)} {ing.inventoryUom}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-semibold text-zinc-900 dark:text-white">
                            {ing.requiredQty.toFixed(2)} {ing.inventoryUom}
                          </p>
                          {ing.shortageQty > 0 && (
                            <p className="text-sm text-red-500 font-medium flex items-center justify-end gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3" />
                              Missing {ing.shortageQty.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className={`p-4 border-t ${plan.isPossible ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/20' : 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/20'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {plan.isPossible ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                        <span className={`font-medium ${plan.isPossible ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                          {plan.isPossible ? 'Stock Sufficient' : 'Insufficient Stock'}
                        </span>
                      </div>
                      
                      <button
                        onClick={handleCommit}
                        disabled={!plan.isPossible || isSubmitting}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                      >
                        {isSubmitting ? 'Committing...' : 'Commit Production'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
