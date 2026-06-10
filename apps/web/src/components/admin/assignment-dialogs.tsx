'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assignUserRestaurantRoleSchema, type AssignUserRestaurantRoleDto } from '@ims/validators';
import { Role, Restaurant } from '@ims/types';
import { apiClient } from '@/lib/api-client';
import { X, Loader2, Search } from 'lucide-react';

interface CreateAssignmentDialogProps {
  restaurants: Restaurant[];
  roles: Role[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateAssignmentDialog({ restaurants, roles, onOpenChange, onSuccess }: CreateAssignmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<AssignUserRestaurantRoleDto>({
    resolver: zodResolver(assignUserRestaurantRoleSchema),
    defaultValues: { userId: '', restaurantId: '', roleId: '' },
  });

  const selectedUserId = watch('userId');

  React.useEffect(() => {
    async function loadUsers() {
      try {
        setLoadingUsers(true);
        const data = await apiClient<{ data: any[] }>('/admin/users');
        setUsers(data.data || []);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u: any) => {
    const q = userSearch.toLowerCase();
    return (
      (u.full_name || u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  const onSubmit = async (data: AssignUserRestaurantRoleDto) => {
    try {
      setIsSubmitting(true);
      await apiClient('/admin/user-restaurant-roles', { method: 'POST', body: data });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create assignment:', error);
      alert('Failed to create assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Assign User to Restaurant</h2>
          <button onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* User selector */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">User</label>
            {loadingUsers ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500 py-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading users...</div>
            ) : (
              <>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={selectedUserId}
                  onChange={(e) => setValue('userId', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a user...</option>
                  {filteredUsers.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {(u.full_name || u.fullName || '')} ({u.email})
                    </option>
                  ))}
                </select>
              </>
            )}
            {errors.userId && <p className="mt-1 text-sm text-red-500">{errors.userId.message}</p>}
          </div>

          {/* Restaurant selector */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Restaurant</label>
            <select {...register('restaurantId')} className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select a restaurant...</option>
              {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {errors.restaurantId && <p className="mt-1 text-sm text-red-500">{errors.restaurantId.message}</p>}
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Role</label>
            <select {...register('roleId')} className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select a role...</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {errors.roleId && <p className="mt-1 text-sm text-red-500">{errors.roleId.message}</p>}
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Create Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
