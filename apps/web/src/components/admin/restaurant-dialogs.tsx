'use client';

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createRestaurantSchema, updateRestaurantSchema, type CreateRestaurantDto, type UpdateRestaurantDto } from '@ims/validators';
import { Restaurant, FranchiseGroup } from '@ims/types';
import { apiClient } from '@/lib/api-client';
import { X, Loader2, Search } from 'lucide-react';

const ALL_TIMEZONES = Intl.supportedValuesOf('timeZone');

interface CreateProps {
  franchiseGroups: FranchiseGroup[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateRestaurantDialog({ franchiseGroups, onOpenChange, onSuccess }: CreateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tzSearch, setTzSearch] = useState('');
  const browserTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<z.input<typeof createRestaurantSchema>>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: { franchiseGroupId: '', name: '', timezone: browserTz },
  });
  const selectedTz = watch('timezone');

  const filteredTimezones = useMemo(() => {
    if (!tzSearch) return ALL_TIMEZONES;
    const q = tzSearch.toLowerCase();
    return ALL_TIMEZONES.filter(t => t.toLowerCase().includes(q));
  }, [tzSearch]);


  const onSubmit = async (data: z.input<typeof createRestaurantSchema>) => {
    try {
      setIsSubmitting(true);
      await apiClient('/tenant/restaurants', { method: 'POST', body: data });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create restaurant:', error);
      alert('Failed to create restaurant');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Create Restaurant</h2>
          <button onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Franchise Group</label>
            <select {...register('franchiseGroupId')} className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select a group...</option>
              {franchiseGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            {errors.franchiseGroupId && <p className="mt-1 text-sm text-red-500">{errors.franchiseGroupId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
            <input {...register('name')} className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Downtown Kitchen" />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Timezone
              {browserTz && !selectedTz && <span className="text-zinc-400 font-normal ml-1">(detected: {browserTz})</span>}
            </label>
            <div className="relative mb-1.5">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search timezones..."
                value={tzSearch}
                onChange={(e) => setTzSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <select
                {...register('timezone')}
                size={6}
                className="w-full bg-white dark:bg-zinc-800 text-sm focus:outline-none [&>option]:px-3 [&>option]:py-1.5"
                onClick={() => setTzSearch('')}
              >
                {filteredTimezones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            {errors.timezone && <p className="mt-1 text-sm text-red-500">{errors.timezone.message}</p>}
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Create Restaurant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditProps {
  restaurant: Restaurant | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditRestaurantDialog({ restaurant, onOpenChange, onSuccess }: EditProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdateRestaurantDto>({
    resolver: zodResolver(updateRestaurantSchema),
    defaultValues: { name: '', timezone: '' },
  });

  React.useEffect(() => {
    if (restaurant) reset({ name: restaurant.name, timezone: restaurant.timezone });
  }, [restaurant, reset]);

  const onSubmit = async (data: UpdateRestaurantDto) => {
    if (!restaurant) return;
    try {
      setIsSubmitting(true);
      await apiClient(`/tenant/restaurants/${restaurant.id}`, { method: 'PATCH', body: data });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update restaurant:', error);
      alert('Failed to update restaurant');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!restaurant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Edit Restaurant</h2>
          <button onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
            <input {...register('name')} className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Timezone</label>
            <select {...register('timezone')} className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {Intl.supportedValuesOf('timeZone').map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
            {errors.timezone && <p className="mt-1 text-sm text-red-500">{errors.timezone.message}</p>}
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
