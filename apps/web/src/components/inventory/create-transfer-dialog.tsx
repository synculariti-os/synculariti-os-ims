'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/use-auth-store';
import { CreateTransferDto } from '@ims/validators';
import { ItemWithOverride } from '@ims/types';
import { X, Plus, Send } from 'lucide-react';

export function CreateTransferDialog() {
  const [open, setOpen] = useState(false);
  
  const [destinationId, setDestinationId] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("");

  const restaurantId = useAuthStore(state => state.restaurantId);
  const queryClient = useQueryClient();

  const { data: itemsResponse } = useQuery({
    queryKey: ['items', restaurantId],
    queryFn: () => apiClient<{ data: ItemWithOverride[] }>('/items?limit=1000'),
    enabled: open && !!restaurantId,
  });

  const items = itemsResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: (dto: CreateTransferDto) => apiClient('/inventory/transfers', {
      method: 'POST',
      body: dto
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers', restaurantId] });
      setOpen(false);
      setDestinationId("");
      setItemId("");
      setQty("");
    },
    onError: (error: any) => {
      alert(`Failed to create transfer: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dto: CreateTransferDto = {
      destinationRestaurantId: destinationId,
      items: [{
        itemId,
        qty: Number(qty)
      }]
    };
    createMutation.mutate(dto);
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
      >
        <Send className="w-4 h-4" />
        New Transfer
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-500" /> New Inventory Transfer
              </h2>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Destination Restaurant ID</label>
                <input
                  type="text"
                  required
                  value={destinationId}
                  onChange={e => setDestinationId(e.target.value)}
                  placeholder="UUID of destination..."
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Item to Transfer</label>
                <select 
                  required
                  value={itemId}
                  onChange={e => setItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select an item...</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.inventoryUom})</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Quantity</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50">
                  {createMutation.isPending ? 'Creating...' : 'Create Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
