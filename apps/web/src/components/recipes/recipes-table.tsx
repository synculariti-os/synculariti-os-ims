'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Recipe, RecipeIngredient } from '@ims/types';
import { apiClient } from '@/lib/api-client';
import { Plus, Search, Layers, Pencil, Trash2, ChevronDown, ChevronRight, Package, Utensils, Link2, AlertTriangle, Loader2 } from 'lucide-react';
import { CreateRecipeDialog } from './create-recipe-dialog';
import { EditRecipeDialog } from './edit-recipe-dialog';
import { cn } from '@/lib/utils';

function ConfirmDeleteModal({ onConfirm, onCancel, name }: { onConfirm: () => void; onCancel: () => void; name: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-zinc-200 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Recipe</h3>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">Are you sure you want to delete <span className="font-semibold text-zinc-900 dark:text-white">{name}</span>? This will remove all its ingredients and any POS mappings.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

function RecipeDetailRow({ recipe }: { recipe: Recipe }) {
  const [ingredients, setIngredients] = useState<RecipeIngredient[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [targetYield, setTargetYield] = useState<number>(recipe.yieldQuantity || 1);

  const fetchIngredients = useCallback(async () => {
    if (ingredients !== null) return;
    setIsLoading(true);
    try {
      const data = await apiClient<{ data: RecipeIngredient[] }>(`/recipes/${recipe.id}/ingredients`);
      setIngredients(data.data || []);
    } catch {
      setIngredients([]);
    } finally {
      setIsLoading(false);
    }
  }, [recipe.id, ingredients]);

  useEffect(() => { fetchIngredients(); }, [recipe.id]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 text-zinc-500 dark:text-zinc-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading ingredients...
      </div>
    );
  }

  if (!ingredients || ingredients.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400 italic py-2">No ingredients defined yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Target Yield:</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={targetYield || ''}
          onChange={(e) => setTargetYield(parseFloat(e.target.value) || 0)}
          className="w-24 px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        {targetYield !== recipe.yieldQuantity && recipe.yieldQuantity > 0 && (
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            (Scaled by {(targetYield / recipe.yieldQuantity).toFixed(2)}x)
          </span>
        )}
      </div>
      <div className="space-y-2">
        {ingredients.map((ing) => {
          const scaledQuantity = recipe.yieldQuantity > 0 
            ? (ing.quantityRequired / recipe.yieldQuantity) * targetYield 
            : ing.quantityRequired;
            
          return (
            <div key={ing.id} className="flex items-center gap-3 text-sm">
              {ing.subRecipeId ? (
                <>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    <Link2 className="w-3 h-3 mr-1" /> Sub-recipe
                  </span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{ing.subRecipeName || ing.subRecipeId}</span>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    <Package className="w-3 h-3 mr-1" /> Ingredient
                  </span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{ing.ingredientItemName || ing.ingredientItemId}</span>
                </>
              )}
              <div className="flex items-center gap-2">
                <span className="text-zinc-900 dark:text-white font-mono font-medium">
                  × {scaledQuantity.toFixed(2)}
                </span>
                {targetYield !== recipe.yieldQuantity && (
                  <span className="text-zinc-400 text-xs line-through font-mono">
                    ({ing.quantityRequired})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RecipesTable() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<Recipe | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRecipes = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<{ data: Recipe[] }>('/recipes');
      setRecipes(data.data || []);
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecipes(); }, []);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deletingRecipe) return;
    setIsDeleting(true);
    try {
      await apiClient(`/recipes/${deletingRecipe.id}`, { method: 'DELETE' });
      setDeletingRecipe(null);
      fetchRecipes();
    } catch (err) {
      console.error('Failed to delete recipe', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = recipes.filter(r => {
    const name = r.producesItemName || r.recipeName || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
            Loading recipes...
          </div>
        ) : filtered.length === 0 ? (
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
                  <th className="p-4 px-6 font-medium w-8" />
                  <th className="p-4 px-6 font-medium">Name</th>
                  <th className="p-4 px-6 font-medium">Type</th>
                  <th className="p-4 px-6 font-medium">Yield Qty</th>
                  <th className="p-4 px-6 font-medium">Yield %</th>
                  <th className="p-4 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50 text-sm">
                {filtered.map((recipe) => {
                  const isExpanded = expandedRows.has(recipe.id);
                  const name = recipe.producesItemId
                    ? (recipe.producesItemName || recipe.producesItemId)
                    : (recipe.recipeName || 'Unnamed');
                  return (
                    <React.Fragment key={recipe.id}>
                      <tr className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                        <td className="p-4 pl-6">
                          <button onClick={() => toggleRow(recipe.id)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="p-4 px-2 font-medium text-zinc-900 dark:text-zinc-100">{name}</td>
                        <td className="p-4 px-6">
                          {recipe.producesItemId ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              <Package className="w-3 h-3" /> PREP
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                              <Utensils className="w-3 h-3" /> MENU
                            </span>
                          )}
                        </td>
                        <td className="p-4 px-6 text-zinc-500 dark:text-zinc-400">{recipe.yieldQuantity}</td>
                        <td className="p-4 px-6 text-zinc-500 dark:text-zinc-400">{recipe.yieldPercent ? `${Math.round(recipe.yieldPercent * 100)}%` : '100%'}</td>
                        <td className="p-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingRecipe(recipe)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              title="Edit recipe"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingRecipe(recipe)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Delete recipe"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td />
                          <td colSpan={4} className="px-6 pb-4 pt-2 bg-zinc-50/50 dark:bg-zinc-800/20">
                            <div className="pl-2 border-l-2 border-blue-200 dark:border-blue-800">
                              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Ingredients & Sub-recipes</p>
                              <RecipeDetailRow recipe={recipe} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCreateOpen && (
        <CreateRecipeDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => { setIsCreateOpen(false); fetchRecipes(); }}
        />
      )}

      {editingRecipe && (
        <EditRecipeDialog
          recipe={editingRecipe}
          onClose={() => setEditingRecipe(null)}
          onSuccess={() => { setEditingRecipe(null); fetchRecipes(); }}
        />
      )}

      {deletingRecipe && (
        <ConfirmDeleteModal
          name={deletingRecipe.producesItemName || deletingRecipe.recipeName || 'this recipe'}
          onConfirm={handleDelete}
          onCancel={() => setDeletingRecipe(null)}
        />
      )}
    </div>
  );
}
