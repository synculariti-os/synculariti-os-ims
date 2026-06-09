'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/use-auth-store';
import { X } from 'lucide-react';
import { ItemWithOverride } from '@ims/types';

interface OpeningBalanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OpeningBalanceDialog({ isOpen, onClose }: OpeningBalanceDialogProps) {
  const { restaurantId } = useAuthStore();
  const queryClient = useQueryClient();
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');

  const { data: itemsResponse } = useQuery({
    queryKey: ['items', restaurantId],
    queryFn: () => apiClient<{ data: ItemWithOverride[] }>('/items?limit=1000'),
    enabled: !!restaurantId && isOpen,
  });

  const items = itemsResponse?.data || [];

  const mutation = useMutation({
    mutationFn: (data: { itemId: string; quantity: number }) =>
      apiClient('/inventory/adjustment', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['ledger', restaurantId] });
      onClose();
      setItemId('');
      setQuantity('');
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to add opening balance');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || !quantity) return;
    mutation.mutate({ itemId, quantity: parseFloat(quantity) });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Add Opening Balance</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Item
            </label>
            <select
              required
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-zinc-900 dark:text-white"
            >
              <option value="">Select an item...</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.inventoryUom})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Quantity
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-zinc-900 dark:text-white"
              placeholder="0.00"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : 'Save Balance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
