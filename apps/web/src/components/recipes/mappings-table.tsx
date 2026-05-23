'use client';

import React, { useEffect, useState } from 'react';
import { MenuItemMapping } from '@ims/types';
import { apiClient } from '@/lib/api-client';
import { Link, Plus, Search, FileSpreadsheet } from 'lucide-react';
import { CreateMappingDialog } from './create-mapping-dialog';

export function MappingsTable() {
  const [mappings, setMappings] = useState<MenuItemMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchMappings = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient<{ data: MenuItemMapping[] }>('/recipes/mappings');
        if (isMounted) setMappings(data.data || []);
      } catch (error) {
        console.error('Failed to fetch mappings:', error);
        // Fallback for missing backend endpoint during early dev
        if (isMounted) setMappings([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMappings();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshMappings = () => {
    apiClient<{ data: MenuItemMapping[] }>('/recipes/mappings')
      .then(data => setMappings(data.data || []))
      .catch(err => {
        console.error(err);
        setMappings([]);
      });
  };

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
            placeholder="Search mappings..."
            disabled
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            Loading mappings...
          </div>
        ) : mappings.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
            <Link className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No mappings found</p>
            <p className="mt-1">Link your POS strings to internal recipes to enable automatic depletion.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                  <th className="p-4 px-6 font-medium">POS Excel String</th>
                  <th className="p-4 px-6 font-medium">Target Recipe ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50 text-sm">
                {mappings.map((mapping, idx) => (
                  <tr key={`${mapping.restaurantId}-${idx}`} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-4 px-6 text-zinc-900 dark:text-zinc-100 font-medium flex items-center">
                      <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500 opacity-70" />
                      {mapping.rawExcelString}
                    </td>
                    <td className="p-4 px-6 text-zinc-500 dark:text-zinc-400 font-mono text-xs">
                      {mapping.recipeId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateMappingDialog 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={() => {
          setIsCreateOpen(false);
          refreshMappings();
        }} 
      />
    </div>
  );
}
