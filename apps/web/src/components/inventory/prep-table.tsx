'use client';

import React, { useEffect, useState } from 'react';
import { PrepProductionLog, ItemWithOverride } from '@ims/types';
import { apiClient } from '@/lib/api-client';
import { ChefHat, Plus, X, Calculator } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';

export function PrepTable() {
  const [logs, setLogs] = useState<PrepProductionLog[]>([]);
  const [items, setItems] = useState<ItemWithOverride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [logsRes, itemsRes] = await Promise.all([
        apiClient<{ data: PrepProductionLog[] }>('/inventory/prep'),
        apiClient<{ data: ItemWithOverride[] }>('/items?limit=1000')
      ]);
      setLogs(logsRes.data);
      setItems(itemsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await apiClient('/inventory/prep', {
        method: 'POST',
        body: {
          prepItemId: data.prepItemId,
          yieldQtyProduced: parseFloat(data.yieldQtyProduced)
        }
      });
      setIsModalOpen(false);
      reset();
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to log prep batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getItemName = (itemId: string) => {
    return items.find(i => i.id === itemId)?.name || `Unknown (${itemId.split('-')[0]})`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-3">
        <Link 
          href="/inventory/prep/plan"
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-900 dark:text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Calculator className="w-4 h-4 text-emerald-500" />
          Plan Production
        </Link>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Log Prep Batch
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Prep Item</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Yield Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-zinc-500 text-sm">Loading logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-zinc-500 text-sm flex flex-col items-center justify-center gap-2">
                    <ChefHat className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                    <span>No prep logs found</span>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                      {new Date(log.producedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">
                      {getItemName(log.prepItemId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                      + {log.yieldQtyProduced.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-blue-500" /> Log Prep Batch
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Prep Item</label>
                <select 
                  {...register('prepItemId', { required: true })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select an item...</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.inventoryUom})</option>)}
                </select>
                <p className="text-xs text-zinc-500 mt-1">Only items with a recipe will be successfully produced.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Yield Quantity Produced</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  {...register('yieldQtyProduced', { required: true })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Logging...' : 'Log Prep Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
