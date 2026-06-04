'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateItemSchema } from '@ims/validators';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, PackagePlus, Wand2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/use-auth-store';
import { Category, ItemWithOverride } from '@ims/types';

type UpdateItemForm = z.infer<typeof updateItemSchema>;

interface EditItemDialogProps {
  item: ItemWithOverride | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditItemDialog({ item, onOpenChange, onSuccess }: EditItemDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const restaurantId = useAuthStore(state => state.restaurantId);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<UpdateItemForm>({
    resolver: zodResolver(updateItemSchema),
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
    },
  });

  const itemType = useWatch({ control, name: 'type' });
  const categoryId = useWatch({ control, name: 'categoryId' });

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        type: item.type as 'RAW' | 'PREP',
        sku: item.sku,
        purchasingUom: item.purchasingUom,
        inventoryUom: item.inventoryUom,
        recipeUom: item.recipeUom,
        invToRecipeRatio: item.invToRecipeRatio,
        isActive: item.isActive,
        categoryId: item.categoryId || '',
      });
    }
  }, [item, reset]);

  const { data: categoriesResponse, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient<{ data: Category[] }>('/items/categories'),
    enabled: !!item,
  });

  const categories = categoriesResponse?.data || [];

  const updateMutation = useMutation({
    mutationFn: (data: UpdateItemForm) => apiClient(`/items/${item.id}`, {
      method: 'PUT',
      body: {
        ...data,
        allergens: typeof data.allergens === 'string' ? (data.allergens as string).split(',').map(a => a.trim()).filter(Boolean) : data.allergens,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', restaurantId] });
      onSuccess();
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to update item';
      setError(msg);
    },
  });

  const onSubmit = (data: UpdateItemForm) => {
    setError(null);
    updateMutation.mutate(data);
  };

  const generateSkuMutation = useMutation({
    mutationFn: (categoryId: string) => apiClient<{ sku: string }>(`/items/generate-sku?categoryId=${categoryId}`),
    onSuccess: (res) => {
      setValue('sku', res.sku, { shouldValidate: true, shouldDirty: true });
    },
    onError: (err) => {
      console.error('Failed to generate SKU', err);
    }
  });

  const handleGenerateSku = () => {
    const categoryId = getValues('categoryId');
    if (!categoryId) return;
    generateSkuMutation.mutate(categoryId);
  };

  if (!item) return null;

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
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Edit Item</h2>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
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

          <form id="edit-item-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                {errors.name && <p className="mt-1.5 text-sm text-red-500">{errors.name?.message}</p>}
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
                    disabled={!categoryId || generateSkuMutation.isPending}
                    className="inline-flex items-center px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                  >
                    {generateSkuMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                    Generate
                  </button>
                </div>
                {errors.sku && <p className="mt-1.5 text-sm text-red-500">{errors.sku?.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Item Type
                </label>
                {item.type === 'PREP' ? (
                  <div className="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-xl cursor-not-allowed">
                    Prep Item (Recipe Attached)
                    <input type="hidden" {...register('type')} value="PREP" />
                  </div>
                ) : (
                  <select
                    {...register('type')}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white appearance-none"
                  >
                    <option value="RAW">Raw Ingredient</option>
                    <option value="PACKAGING">Packaging</option>
                    <option value="MERCHANDISE">Merchandise</option>
                  </select>
                )}
                {errors.type && <p className="mt-1.5 text-sm text-red-500">{errors.type?.message}</p>}
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
                {errors.inventoryUom && <p className="mt-1.5 text-sm text-red-500">{errors.inventoryUom?.message}</p>}
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
                  {errors.purchasingUom && <p className="mt-1.5 text-sm text-red-500">{errors.purchasingUom?.message}</p>}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-item-form"
            disabled={updateMutation.isPending}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
          >
            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
