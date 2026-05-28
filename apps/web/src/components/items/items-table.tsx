'use client';

import React, { useEffect, useState } from 'react';
import { ItemWithOverride } from '@ims/types';
import { apiClient } from '@/lib/api-client';
import { Package, Plus, Search, Tag, Scale } from 'lucide-react';
import { CreateItemDialog } from './create-item-dialog';
import { EditItemDialog } from './edit-item-dialog';

export function ItemsTable() {
  const [items, setItems] = useState<ItemWithOverride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemWithOverride | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient<{ data: ItemWithOverride[] }>('/items');
        if (isMounted) setItems(data.data || []);
      } catch (error) {
        console.error('Failed to fetch items:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchItems();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshItems = () => {
    apiClient<{ data: ItemWithOverride[] }>('/items')
      .then(data => setItems(data.data || []))
      .catch(err => console.error(err));
  };

  const filteredItems = items.filter(
    (item) =>
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Item
        </button>
      </div>

      <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            Loading master catalog...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
            <Package className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No items found</p>
            <p className="mt-1">Get started by creating a new inventory item.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                  <th className="p-4 px-6 font-medium">Name</th>
                  <th className="p-4 px-6 font-medium">Type</th>
                  <th className="p-4 px-6 font-medium">Category</th>
                  <th className="p-4 px-6 font-medium">Inv. UOM</th>
                  <th className="p-4 px-6 font-medium hidden sm:table-cell">Purch. UOM</th>
                  <th className="p-4 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50 text-sm">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-4 px-6 text-zinc-900 dark:text-zinc-100 font-medium">
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">{item.sku}</span>
                      </div>
                    </td>
                    <td className="p-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.type === 'RAW' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        item.type === 'PREP' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                        'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4 px-6 text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center">
                        <Tag className="h-3 w-3 mr-1.5 opacity-70" />
                        {item.categoryName || 'Uncategorized'}
                      </div>
                    </td>
                    <td className="p-4 px-6 text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center">
                        <Scale className="h-3 w-3 mr-1.5 opacity-70" />
                        <span className="font-medium text-zinc-700 dark:text-zinc-300 mr-1">{item.inventoryUom}</span>
                      </div>
                    </td>
                    <td className="p-4 px-6 text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">
                      {item.purchasingUom || '-'}
                    </td>
                    <td className="p-4 px-6 text-right">
                      <button 
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                        onClick={() => setEditingItem(item)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateItemDialog 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={() => {
          setIsCreateOpen(false);
          refreshItems();
        }} 
      />

      <EditItemDialog
        item={editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSuccess={() => {
          setEditingItem(null);
          refreshItems();
        }}
      />
    </div>
  );
}
