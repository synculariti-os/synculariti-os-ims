'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createItemSchema } from '@ims/validators';
import { z } from 'zod';
import { X, Loader2, PackagePlus, Plus, Trash2, Wand2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Category, ItemWithOverride } from '@ims/types';


type CreateItemForm = z.infer<typeof createItemSchema> & {
  ingredients?: { ingredientItemId: string; quantityRequired: number }[];
  recipeYieldQuantity?: number;
};

interface CreateItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateItemDialog({ isOpen, onClose, onSuccess }: CreateItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<ItemWithOverride[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isGeneratingSku, setIsGeneratingSku] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateItemForm>({
    resolver: zodResolver(createItemSchema) as any,
    defaultValues: {
      name: '',
      type: 'RAW' as const,
      sku: '',
      purchasingUom: 'kg',
      inventoryUom: 'kg',
      recipeUom: null,
      invToRecipeRatio: 1,
      isActive: true,
      categoryId: '',
      ingredients: [{ ingredientItemId: '', quantityRequired: 1 }],
      recipeYieldQuantity: 1,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredients',
  });

  const itemType = watch('type');

  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          setIsLoadingCategories(true);
          const [catRes, itemsRes] = await Promise.all([
            apiClient<{ data: Category[] }>('/items/categories'),
            apiClient<{ data: ItemWithOverride[] }>('/items')
          ]);
          setCategories(catRes.data || []);
          setItems(itemsRes.data || []);
        } catch (error) {
          console.error('Failed to fetch data:', error);
        } finally {
          setIsLoadingCategories(false);
        }
      };
      fetchCategories();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: CreateItemForm) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // 1. Create the Item Master record
      const itemResponse = await apiClient<{ data: { id: string } }>('/items', {
        method: 'POST',
        body: {
          name: data.name,
          type: data.type,
          sku: data.sku,
          purchasingUom: data.purchasingUom,
          inventoryUom: data.inventoryUom,
          recipeUom: data.recipeUom,
          invToRecipeRatio: data.invToRecipeRatio,
          isActive: data.isActive,
          categoryId: data.categoryId,
        },
      });

      // 2. If it's a PREP item and we have ingredients, create the Recipe
      if (data.type === 'PREP' && data.ingredients && data.ingredients.length > 0 && data.ingredients[0].ingredientItemId) {
        // Filter out any empty ingredient rows
        const validIngredients = data.ingredients.filter(ing => ing.ingredientItemId && ing.quantityRequired > 0);
        
        if (validIngredients.length > 0) {
          await apiClient('/recipes', {
            method: 'POST',
            body: {
              producesItemId: itemResponse.data.id,
              yieldQuantity: data.recipeYieldQuantity || 1,
              ingredients: validIngredients,
            },
          });
        }
      }

      reset();
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create item';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const rawItems = items.filter(i => i.type === 'RAW');

  const handleGenerateSku = async () => {
    const categoryId = watch('categoryId');
    if (!categoryId) return;
    setIsGeneratingSku(true);
    try {
      const res = await apiClient<{ sku: string }>(`/items/generate-sku?categoryId=${categoryId}`);
      setValue('sku', res.sku);
    } catch (err) {
      console.error('Failed to generate SKU', err);
    } finally {
      setIsGeneratingSku(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div 
        className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <PackagePlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Create New Item</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          <form id="create-item-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Item Name
                </label>
                <input
                  {...register('name')}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
                  placeholder="e.g. Organic Flour"
                />
                {errors.name && <p className="mt-1.5 text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  SKU
                </label>
                <div className="flex gap-2">
                  <input
                    {...register('sku')}
                    className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
                    placeholder="e.g. FLOUR-001"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    disabled={isGeneratingSku || !watch('categoryId')}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    title="Auto-generate SKU based on category"
                  >
                    {isGeneratingSku ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                    Generate
                  </button>
                </div>
                {errors.sku && <p className="mt-1.5 text-sm text-red-500">{errors.sku.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Item Type
                </label>
                <select
                  {...register('type')}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white appearance-none"
                >
                  <option value="RAW">Raw Ingredient</option>
                  <option value="PREP">Prep Item</option>
                  <option value="PACKAGING">Packaging</option>
                  <option value="MERCHANDISE">Merchandise</option>
                </select>
                {errors.type && <p className="mt-1.5 text-sm text-red-500">{errors.type.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Category
                </label>
                <select
                  {...register('categoryId')}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white appearance-none"
                  disabled={isLoadingCategories}
                >
                  <option value="">{isLoadingCategories ? 'Loading...' : 'Select Category...'}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="mt-1.5 text-sm text-red-500">Please select a valid category</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Inventory UOM
                </label>
                <input
                  {...register('inventoryUom')}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
                  placeholder="e.g. kg, ml, piece"
                />
                {errors.inventoryUom && <p className="mt-1.5 text-sm text-red-500">{errors.inventoryUom.message}</p>}
              </div>

              {itemType === 'RAW' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Purchasing UOM
                  </label>
                  <input
                    {...register('purchasingUom')}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
                    placeholder="e.g. sack, case"
                  />
                  {errors.purchasingUom && <p className="mt-1.5 text-sm text-red-500">{errors.purchasingUom.message}</p>}
                </div>
              )}
            </div>

            {/* Dynamic Recipe / BOM Section for PREP items */}
            {itemType === 'PREP' && (
              <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <PackagePlus className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Recipe / Ingredients</h3>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Yield Quantity (Units produced)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('recipeYieldQuantity', { valueAsNumber: true })}
                    className="w-full md:w-1/2 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
                    placeholder="1.0"
                  />
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start space-x-3 bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <div className="flex-1">
                        <select
                          {...register(`ingredients.${index}.ingredientItemId`)}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                        >
                          <option value="">Select Ingredient...</option>
                          {rawItems.map(item => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          step="0.001"
                          {...register(`ingredients.${index}.quantityRequired`, { valueAsNumber: true })}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                          placeholder="Qty"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <button
                  type="button"
                  onClick={() => append({ ingredientItemId: '', quantityRequired: 1 })}
                  className="mt-3 inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Another Ingredient
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-item-form"
            disabled={isSubmitting}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Item'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
