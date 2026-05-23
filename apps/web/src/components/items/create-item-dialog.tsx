'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createItemSchema } from '@ims/validators';
import { z } from 'zod';
import { X, Loader2, PackagePlus } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

type CreateItemForm = z.infer<typeof createItemSchema>;

interface CreateItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateItemDialog({ isOpen, onClose, onSuccess }: CreateItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      name: '',
      type: 'RAW',
      sku: '',
      purchasingUom: 'kg',
      inventoryUom: 'kg',
      recipeUom: null,
      invToRecipeRatio: 1,
      isActive: true,
      categoryId: '',
    },
  });

  const itemType = watch('type');

  if (!isOpen) return null;

  const onSubmit = async (formData: unknown) => {
    const data = formData as CreateItemForm;
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient('/items', {
        method: 'POST',
        body: data,
      });
      reset();
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create item';
      setError(msg);
    } finally {
      setIsSubmitting(false);
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
                  Category ID (Optional)
                </label>
                <input
                  {...register('categoryId')}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
                  placeholder="e.g. cat_123"
                />
                {errors.categoryId && <p className="mt-1.5 text-sm text-red-500">{errors.categoryId.message}</p>}
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
