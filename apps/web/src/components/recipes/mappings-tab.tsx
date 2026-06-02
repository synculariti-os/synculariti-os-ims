'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MenuItemMapping } from '@ims/types';
import { apiClient } from '@/lib/api-client';
import { Link2, Plus, Search, FileSpreadsheet, Trash2, AlertTriangle, ArrowRight } from 'lucide-react';
import { CreateMappingDialog } from './create-mapping-dialog';

function ConfirmDeleteModal({ onConfirm, onCancel, name }: { onConfirm: () => void; onCancel: () => void; name: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-zinc-200 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Remove Mapping</h3>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">Remove the POS mapping for <span className="font-semibold text-zinc-900 dark:text-white">&ldquo;{name}&rdquo;</span>? Future uploads with this string will be flagged as unmapped.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors">Remove</button>
        </div>
      </div>
    </div>
  );
}

export function MappingsTab() {
  const [mappings, setMappings] = useState<MenuItemMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingMapping, setDeletingMapping] = useState<MenuItemMapping | null>(null);

  const fetchMappings = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<{ data: MenuItemMapping[] }>('/recipes/mappings');
      setMappings(data.data || []);
    } catch (error) {
      console.error('Failed to fetch mappings:', error);
      setMappings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchMappings(); }, []);

  const handleDelete = async () => {
    if (!deletingMapping) return;
    try {
      await apiClient(`/recipes/mappings/${deletingMapping.id}`, { method: 'DELETE' });
      setDeletingMapping(null);
      fetchMappings();
    } catch (err) {
      console.error('Failed to delete mapping', err);
    }
  };

  const filtered = mappings.filter(m =>
    m.rawExcelString.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.targetRecipeName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-2xl p-4 text-sm text-blue-700 dark:text-blue-300">
        <strong>How it works:</strong> When you upload a POS file, item names are matched against this list. Matched items auto-deplete inventory. Unmatched items appear in the Smart Mapping panel for manual linking.
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all"
            placeholder="Search mappings..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Link POS String
        </button>
      </div>

      <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
            Loading mappings...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
            <Link2 className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No mappings found</p>
            <p className="mt-1">Link your POS item names to BOMs for automatic inventory depletion.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                  <th className="p-4 px-6 font-medium">POS Item Name</th>
                  <th className="p-4 px-2 font-medium" />
                  <th className="p-4 px-6 font-medium">Maps To (Recipe / BOM)</th>
                  <th className="p-4 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50 text-sm">
                {filtered.map((mapping) => (
                  <tr key={mapping.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-4 px-6 text-zinc-900 dark:text-zinc-100 font-medium">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-500 opacity-70 shrink-0" />
                        <span className="font-mono text-sm">{mapping.rawExcelString}</span>
                      </div>
                    </td>
                    <td className="p-4 px-2 text-zinc-400">
                      <ArrowRight className="w-4 h-4" />
                    </td>
                    <td className="p-4 px-6 text-zinc-700 dark:text-zinc-300 font-medium">
                      {mapping.targetRecipeName || (
                        <span className="font-mono text-xs text-zinc-400">{mapping.recipeId.substring(0, 12)}...</span>
                      )}
                    </td>
                    <td className="p-4 px-6 text-right">
                      <button
                        onClick={() => setDeletingMapping(mapping)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Remove mapping"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCreateOpen && (
        <CreateMappingDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => { setIsCreateOpen(false); fetchMappings(); }}
        />
      )}

      {deletingMapping && (
        <ConfirmDeleteModal
          name={deletingMapping.rawExcelString}
          onConfirm={handleDelete}
          onCancel={() => setDeletingMapping(null)}
        />
      )}
    </div>
  );
}
