'use client';

import React, { useEffect, useState } from 'react';
import { Recipe } from '@ims/types';
import { apiClient } from '@/lib/api-client';
import { Plus, Search, Layers } from 'lucide-react';
import { CreateRecipeDialog } from './create-recipe-dialog';

export function RecipesTable() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchRecipes = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient<{ data: Recipe[] }>('/recipes');
        if (isMounted) setRecipes(data.data || []);
      } catch (error) {
        console.error('Failed to fetch recipes:', error);
        // Fallback for missing backend endpoint during early dev
        if (isMounted) setRecipes([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchRecipes();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshRecipes = () => {
    apiClient<{ data: Recipe[] }>('/recipes')
      .then(data => setRecipes(data.data || []))
      .catch(err => {
        console.error(err);
        setRecipes([]);
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
            placeholder="Search recipes..."
            disabled
          />
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Recipe
        </button>
      </div>

      <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            Loading recipes...
          </div>
        ) : recipes.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
            <Layers className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No recipes found</p>
            <p className="mt-1">Create your first Bill of Materials (BOM) to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                  <th className="p-4 px-6 font-medium">Recipe ID</th>
                  <th className="p-4 px-6 font-medium">Produces Item</th>
                  <th className="p-4 px-6 font-medium">Yield Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50 text-sm">
                {recipes.map((recipe) => (
                  <tr key={recipe.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-4 px-6 text-zinc-900 dark:text-zinc-100 font-mono text-xs">
                      {recipe.id.substring(0, 8)}...
                    </td>
                    <td className="p-4 px-6 font-medium text-zinc-700 dark:text-zinc-300">
                      {recipe.producesItemId}
                    </td>
                    <td className="p-4 px-6 text-zinc-500 dark:text-zinc-400">
                      {recipe.yieldQuantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateRecipeDialog 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={() => {
          setIsCreateOpen(false);
          refreshRecipes();
        }} 
      />
    </div>
  );
}
