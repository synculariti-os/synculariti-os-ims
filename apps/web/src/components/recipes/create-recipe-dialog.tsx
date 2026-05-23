'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRecipeSchema } from '@ims/validators';
import { z } from 'zod';
import { X, Loader2, FileJson, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ItemWithOverride } from '@ims/types';

type CreateRecipeForm = z.infer<typeof createRecipeSchema>;

interface CreateRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateRecipeDialog({ isOpen, onClose, onSuccess }: CreateRecipeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ItemWithOverride[]>([]);

  useEffect(() => {
    if (isOpen) {
      apiClient<{ data: ItemWithOverride[] }>('/items')
        .then(res => setItems(res.data || []))
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRecipeForm>({
    resolver: zodResolver(createRecipeSchema),
    defaultValues: {
      producesItemId: '',
      yieldQuantity: 1,
      ingredients: [{ ingredientItemId: '', quantityRequired: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredients',
  });

  if (!isOpen) return null;

  const onSubmit = async (data: CreateRecipeForm) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient('/recipes', {
        method: 'POST',
        body: data,
      });
      reset();
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create recipe';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const prepItems = items.filter(i => i.type === 'PREP');
  const rawItems = items.filter(i => i.type === 'RAW');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div 
        className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <FileJson className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Create Bill of Materials</h2>
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

          <form id="create-recipe-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Produces Item (Prep Item)
                </label>
                <select
                  {...register('producesItemId')}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white appearance-none"
                >
                  <option value="">Select an Item...</option>
                  {prepItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                {errors.producesItemId && <p className="mt-1.5 text-sm text-red-500">{errors.producesItemId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Yield Quantity (Units produced)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('yieldQuantity', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
                  placeholder="1.0"
                />
                {errors.yieldQuantity && <p className="mt-1.5 text-sm text-red-500">{errors.yieldQuantity.message}</p>}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Ingredients
                </label>
                <button
                  type="button"
                  onClick={() => append({ ingredientItemId: '', quantityRequired: 1 })}
                  className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Ingredient
                </button>
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
                      {errors.ingredients?.[index]?.ingredientItemId && (
                        <p className="mt-1 text-xs text-red-500">{errors.ingredients[index]?.ingredientItemId?.message}</p>
                      )}
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        step="0.001"
                        {...register(`ingredients.${index}.quantityRequired`, { valueAsNumber: true })}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                        placeholder="Qty"
                      />
                      {errors.ingredients?.[index]?.quantityRequired && (
                        <p className="mt-1 text-xs text-red-500">{errors.ingredients[index]?.quantityRequired?.message}</p>
                      )}
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {errors.ingredients && typeof errors.ingredients.message === 'string' && (
                <p className="mt-2 text-sm text-red-500">{errors.ingredients.message}</p>
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
            form="create-recipe-form"
            disabled={isSubmitting}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Recipe'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
