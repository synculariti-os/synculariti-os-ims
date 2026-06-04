'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { menuItemMappingSchema } from '@ims/validators';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Link } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/use-auth-store';
import { Recipe } from '@ims/types';

type CreateMappingForm = z.infer<typeof menuItemMappingSchema>;

interface CreateMappingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateMappingDialog({ isOpen, onClose, onSuccess }: CreateMappingDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const restaurantId = useAuthStore(state => state.restaurantId);
  const queryClient = useQueryClient();

  const { data: recipesResponse } = useQuery({
    queryKey: ['recipes', restaurantId],
    queryFn: () => apiClient<{ data: Recipe[] }>('/recipes'),
    enabled: isOpen && !!restaurantId,
  });

  const recipes = recipesResponse?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateMappingForm>({
    resolver: zodResolver(menuItemMappingSchema),
    defaultValues: {
      rawExcelString: '',
      recipeId: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateMappingForm) => apiClient('/recipes/mappings', {
      method: 'POST',
      body: data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappings', restaurantId] });
      reset();
      onSuccess();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to create POS mapping';
      setError(msg);
    }
  });

  if (!isOpen) return null;

  const onSubmit = (data: CreateMappingForm) => {
    setError(null);
    createMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div 
        className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Link className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Map POS String</h2>
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

          <form id="create-mapping-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Exact POS Excel String
              </label>
              <input
                {...register('rawExcelString')}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
                placeholder="e.g. Burger Patty 150g"
              />
              <p className="mt-1.5 text-xs text-zinc-500">This must exactly match the string found in your Sales POS upload file.</p>
              {errors.rawExcelString && <p className="mt-1.5 text-sm text-red-500">{errors.rawExcelString.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Target Recipe
              </label>
              <select
                {...register('recipeId')}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white appearance-none"
              >
                <option value="">Select an existing recipe...</option>
                {recipes.map(recipe => (
                  <option key={recipe.id} value={recipe.id}>Recipe for {recipe.producesItemId}</option>
                ))}
              </select>
              {errors.recipeId && <p className="mt-1.5 text-sm text-red-500">{errors.recipeId.message}</p>}
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
            form="create-mapping-form"
            disabled={createMutation.isPending}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Linking...
              </>
            ) : (
              'Link POS String'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
