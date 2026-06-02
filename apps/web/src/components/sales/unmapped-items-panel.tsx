'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Recipe } from '@ims/types';
import { Loader2, AlertCircle, Save, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnmappedRow {
  id: string;
  rawItemName: string;
  quantitySold: number;
}

interface SmartMappingReviewProps {
  batchId: string;
  onResolved: () => void;
}

export function SmartMappingReview({ batchId, onResolved }: SmartMappingReviewProps) {
  const [unmappedRows, setUnmappedRows] = useState<UnmappedRow[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mappings, setMappings] = useState<Record<string, string>>({}); // rawItemName -> recipeId

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [rowsRes, recipesRes] = await Promise.all([
          apiClient<{ data: UnmappedRow[] }>(`/sales-imports/unmapped-rows?batchId=${batchId}`),
          apiClient<{ data: Recipe[] }>('/recipes')
        ]);
        
        if (isMounted) {
          // Group by rawItemName since the same unmapped item might appear multiple times in a batch
          const uniqueRows = Array.from(
            new Map(rowsRes.data.map(r => [r.rawItemName, r])).values()
          );
          setUnmappedRows(uniqueRows);
          setRecipes(recipesRes.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch unmapped rows or recipes:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [batchId]);

  const handleSaveMappings = async () => {
    const itemsToMap = Object.entries(mappings).filter(([_, recipeId]) => recipeId);
    if (itemsToMap.length === 0) return;

    setIsSubmitting(true);
    try {
      // Save all mappings
      await Promise.all(
        itemsToMap.map(([rawExcelString, recipeId]) =>
          apiClient('/recipes/mappings', {
            method: 'POST',
            body: { rawExcelString, recipeId }
          })
        )
      );

      // We ideally want to re-trigger batch processing or just mark them resolved for now
      // The user will have to re-upload the file, or we can add a retry batch endpoint later.
      // For now, let's just clear the mapped items from the UI
      setUnmappedRows(prev => prev.filter(r => !mappings[r.rawItemName]));
      setMappings({});
      
      if (unmappedRows.length === itemsToMap.length) {
        onResolved(); // All resolved!
      }
    } catch (error) {
      console.error('Failed to save mappings:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-zinc-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading unmapped items...
      </div>
    );
  }

  if (unmappedRows.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h4 className="text-lg font-medium text-zinc-900 dark:text-white">All items mapped!</h4>
        <p className="text-zinc-500 mt-1">There are no unmapped POS items in this batch.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-lg mt-4">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-amber-50 dark:bg-amber-900/10 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-900 dark:text-amber-500">Smart Mapping Review</h4>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
            We found {unmappedRows.length} unmapped item{unmappedRows.length === 1 ? '' : 's'} in this batch. 
            Map them to a recipe below to track inventory for future uploads.
          </p>
        </div>
      </div>
      
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {unmappedRows.map((row) => (
          <div key={row.rawItemName} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">{row.rawItemName}</p>
              <p className="text-xs text-zinc-500 mt-1">Sold: {row.quantitySold} times in this batch</p>
            </div>
            <div className="w-full sm:w-64 shrink-0">
              <select
                value={mappings[row.rawItemName] || ''}
                onChange={(e) => setMappings(prev => ({ ...prev, [row.rawItemName]: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Recipe/BOM...</option>
                {recipes.map(r => (
                  <option key={r.id} value={r.id}>{r.recipeName || 'Unnamed Recipe'}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-end">
        <button
          onClick={handleSaveMappings}
          disabled={isSubmitting || Object.values(mappings).filter(Boolean).length === 0}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl disabled:opacity-50 transition-colors shadow-sm"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Mappings
        </button>
      </div>
    </div>
  );
}
