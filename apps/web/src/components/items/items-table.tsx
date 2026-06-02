'use client';

import React, { useEffect, useState } from 'react';
import { ItemWithOverride } from '@ims/types';
import { apiClient } from '@/lib/api-client';
import { Package, Plus, Search, Tag, Scale, Pencil, Trash2, AlertTriangle, TrendingUp } from 'lucide-react';
import { CreateItemDialog } from './create-item-dialog';
import { EditItemDialog } from './edit-item-dialog';
import { ItemOverridesDialog } from './item-overrides-dialog';
import { UomConversionDialog } from './uom-conversion-dialog';
import { Settings2 } from 'lucide-react';

function ConfirmDeleteModal({ onConfirm, onCancel, name }: { onConfirm: () => void; onCancel: () => void; name: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-zinc-200 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Item</h3>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">Delete <span className="font-semibold text-zinc-900 dark:text-white">{name}</span>? This is permanent and cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

export function ItemsTable() {
  const [items, setItems] = useState<ItemWithOverride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemWithOverride | null>(null);
  const [deletingItem, setDeletingItem] = useState<ItemWithOverride | null>(null);
  const [overrideItem, setOverrideItem] = useState<ItemWithOverride | null>(null);
  const [uomItem, setUomItem] = useState<ItemWithOverride | null>(null);

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
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/reports/vendor-pricing?itemId=${item.id}`}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                          title="Price trends"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </a>
                        <button
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                          onClick={() => setOverrideItem(item)}
                          title="Par Level & Overrides"
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          onClick={() => setUomItem(item)}
                          title="UOM Conversion"
                        >
                          <Scale className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          onClick={() => setEditingItem(item)}
                          title="Edit item"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          onClick={() => setDeletingItem(item)}
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

      <ItemOverridesDialog
        item={overrideItem}
        isOpen={!!overrideItem}
        onClose={() => setOverrideItem(null)}
        onSaved={() => {
          setOverrideItem(null);
          refreshItems();
        }}
      />

      <UomConversionDialog
        item={uomItem}
        isOpen={!!uomItem}
        onClose={() => setUomItem(null)}
        onSaved={() => {
          setUomItem(null);
          refreshItems();
        }}
      />

      {deletingItem && (
        <ConfirmDeleteModal
          name={deletingItem.name}
          onConfirm={async () => {
            try {
              await apiClient(`/items/${deletingItem.id}`, { method: 'DELETE' });
              setDeletingItem(null);
              refreshItems();
            } catch (err) {
              console.error('Failed to delete item', err);
            }
          }}
          onCancel={() => setDeletingItem(null)}
        />
      )}
    </div>
  );
}
