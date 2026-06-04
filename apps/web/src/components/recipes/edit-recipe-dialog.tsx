'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Pencil, Plus, Trash2, Package, Link2, ChevronDown } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/use-auth-store';
import { ItemWithOverride, Recipe, RecipeIngredient } from '@ims/types';

type LineType = 'ingredient' | 'sub_recipe';

interface IngredientLine {
  id: string;
  lineType: LineType;
  ingredientItemId: string;
  subRecipeId: string;
  quantityRequired: number;
}

function mapIngredientToLine(ing: RecipeIngredient): IngredientLine {
  return {
    id: ing.id,
    lineType: ing.subRecipeId ? 'sub_recipe' : 'ingredient',
    ingredientItemId: ing.ingredientItemId || '',
    subRecipeId: ing.subRecipeId || '',
    quantityRequired: ing.quantityRequired,
  };
}

interface EditRecipeDialogProps {
  recipe: Recipe;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditRecipeDialog({ recipe, onClose, onSuccess }: EditRecipeDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const restaurantId = useAuthStore(state => state.restaurantId);
  const queryClient = useQueryClient();
  const [yieldQuantity, setYieldQuantity] = useState(recipe.yieldQuantity);
  const [yieldPercent, setYieldPercent] = useState(recipe.yieldPercent ? Math.round(recipe.yieldPercent * 100) : 100);
  const [lines, setLines] = useState<IngredientLine[]>([]);

  const { data: itemsResponse, isLoading: isLoadingItems } = useQuery({
    queryKey: ['items', restaurantId],
    queryFn: () => apiClient<{ data: ItemWithOverride[] }>('/items'),
  });

  const { data: recipesResponse, isLoading: isLoadingRecipes } = useQuery({
    queryKey: ['recipes', restaurantId],
    queryFn: () => apiClient<{ data: Recipe[] }>('/recipes'),
  });

  const { data: ingredientsResponse, isLoading: isLoadingIngredients } = useQuery({
    queryKey: ['recipe-ingredients', recipe.id],
    queryFn: () => apiClient<{ data: RecipeIngredient[] }>(`/recipes/${recipe.id}/ingredients`),
  });

  const items = itemsResponse?.data || [];
  const recipes = (recipesResponse?.data || []).filter(r => r.id !== recipe.id);

  const isLoading = isLoadingItems || isLoadingRecipes || isLoadingIngredients;

  useEffect(() => {
    if (!isLoadingIngredients) {
      if (ingredientsResponse?.data && ingredientsResponse.data.length > 0) {
        setLines(ingredientsResponse.data.map(mapIngredientToLine));
      } else {
        setLines([{ id: crypto.randomUUID(), lineType: 'ingredient', ingredientItemId: '', subRecipeId: '', quantityRequired: 1 }]);
      }
    }
  }, [isLoadingIngredients, ingredientsResponse?.data]);

  const addLine = (type: LineType) => {
    setLines(prev => [...prev, { id: crypto.randomUUID(), lineType: type, ingredientItemId: '', subRecipeId: '', quantityRequired: 1 }]);
  };

  const removeLine = (id: string) => setLines(prev => prev.filter(l => l.id !== id));

  const updateLine = (id: string, patch: Partial<IngredientLine>) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  };

  const updateMutation = useMutation({
    mutationFn: (payload: any) => apiClient(`/recipes/${recipe.id}`, { method: 'PUT', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes', restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['recipe-ingredients', recipe.id] });
      onSuccess();
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to update recipe');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const ingredients = lines.map(l => l.lineType === 'ingredient'
      ? { lineType: 'ingredient' as const, ingredientItemId: l.ingredientItemId, quantityRequired: l.quantityRequired }
      : { lineType: 'sub_recipe' as const, subRecipeId: l.subRecipeId, quantityRequired: l.quantityRequired }
    );
    updateMutation.mutate({ yieldQuantity, yieldPercent: yieldPercent / 100, ingredients });
  };

  const name = recipe.producesItemName || recipe.recipeName || 'Recipe';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <Pencil className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Edit Recipe</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/30">{error}</div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
            </div>
          ) : (
            <form id="edit-recipe-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Yield Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={yieldQuantity}
                    onChange={e => setYieldQuantity(parseFloat(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" title="If cooking reduces weight, enter the % that remains.">
                    Cooking Yield %
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="100"
                      value={yieldPercent}
                      onChange={e => setYieldPercent(parseInt(e.target.value) || 100)}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white pr-8"
                    />
                    <span className="absolute right-3 top-3 text-zinc-400 pointer-events-none">%</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Ingredients & Sub-recipes
                  </label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => addLine('ingredient')} className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <Package className="w-3.5 h-3.5 mr-1" /> Add Ingredient
                    </button>
                    <button type="button" onClick={() => addLine('sub_recipe')} className="inline-flex items-center text-sm text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                      <Link2 className="w-3.5 h-3.5 mr-1" /> Add Sub-recipe
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {lines.map((line) => (
                    <div key={line.id} className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${line.lineType === 'ingredient' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
                        {line.lineType === 'ingredient' ? <Package className="w-3 h-3 mr-1" /> : <Link2 className="w-3 h-3 mr-1" />}
                        {line.lineType === 'ingredient' ? 'Item' : 'Sub-recipe'}
                      </span>

                      <div className="flex-1 relative">
                        <select
                          value={line.lineType === 'ingredient' ? line.ingredientItemId : line.subRecipeId}
                          onChange={e => line.lineType === 'ingredient' ? updateLine(line.id, { ingredientItemId: e.target.value }) : updateLine(line.id, { subRecipeId: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white appearance-none pr-7"
                        >
                          <option value="">{line.lineType === 'ingredient' ? 'Select item...' : 'Select sub-recipe...'}</option>
                          {line.lineType === 'ingredient'
                            ? items.map(item => <option key={item.id} value={item.id}>{item.name} ({item.type})</option>)
                            : recipes.map(r => <option key={r.id} value={r.id}>{r.producesItemName || r.recipeName || r.id.substring(0, 8)}</option>)
                          }
                        </select>
                        <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                      </div>

                      <input
                        type="number"
                        step="0.001"
                        value={line.quantityRequired}
                        onChange={e => updateLine(line.id, { quantityRequired: parseFloat(e.target.value) || 0 })}
                        className="w-24 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                        placeholder="Qty"
                      />

                      {lines.length > 1 && (
                        <button type="button" onClick={() => removeLine(line.id)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            form="edit-recipe-form"
            disabled={updateMutation.isPending || isLoading}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
