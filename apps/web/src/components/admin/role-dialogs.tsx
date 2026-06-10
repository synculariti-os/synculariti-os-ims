'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRoleSchema, updateRoleSchema, type CreateRoleDto, type UpdateRoleDto } from '@ims/validators';
import { Role, PermissionCode, PERMISSION_CODES } from '@ims/types';
import { apiClient } from '@/lib/api-client';
import { X, Loader2, Check } from 'lucide-react';

const PERMISSION_LABELS: Record<string, string> = {
  [PERMISSION_CODES.INVENTORY_READ]: 'View stock levels and ledger',
  [PERMISSION_CODES.INVENTORY_WRITE]: 'Record waste, transfers, prep production',
  [PERMISSION_CODES.INVENTORY_COUNT]: 'Perform physical inventory counts',
  [PERMISSION_CODES.PROCUREMENT_READ]: 'View vendors and purchase orders',
  [PERMISSION_CODES.PROCUREMENT_WRITE]: 'Create and receive purchase orders',
  [PERMISSION_CODES.RECIPE_READ]: 'View recipes and POS mappings',
  [PERMISSION_CODES.RECIPE_WRITE]: 'Create and edit recipes',
  [PERMISSION_CODES.SALES_IMPORT]: 'Upload and process POS sales files',
  [PERMISSION_CODES.SALES_READ]: 'View sales import history',
  [PERMISSION_CODES.REPORTING_READ]: 'View reports and analytics',
  [PERMISSION_CODES.ADMIN_USERS]: 'Manage user-role assignments',
  [PERMISSION_CODES.ADMIN_ROLES]: 'Manage roles and permissions',
  [PERMISSION_CODES.ADMIN_TENANTS]: 'Manage franchise groups and restaurants',
};

const allPermissions = Object.values(PERMISSION_CODES);

interface PermissionGridProps {
  selected: string[];
  onChange: (perms: string[]) => void;
  loading?: boolean;
}

export function PermissionGrid({ selected, onChange, loading }: PermissionGridProps) {
  const toggle = (code: string) => {
    onChange(selected.includes(code) ? selected.filter((p) => p !== code) : [...selected, code]);
  };

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
      {allPermissions.map((code) => (
        <label
          key={code}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
            selected.includes(code)
              ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
              : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            selected.includes(code)
              ? 'bg-blue-600 border-blue-600'
              : 'border-zinc-300 dark:border-zinc-600'
          }`}>
            {selected.includes(code) && <Check className="w-3.5 h-3.5 text-white" />}
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-zinc-900 dark:text-white">{code}</span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{PERMISSION_LABELS[code] || code}</p>
          </div>
        </label>
      ))}
    </div>
  );
}

interface CreateProps {
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateRoleDialog({ onOpenChange, onSuccess }: CreateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const { register, handleSubmit, formState: { errors } } = useForm<CreateRoleDto>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { name: '', description: '' },
  });

  const onSubmit = async (data: CreateRoleDto) => {
    try {
      setIsSubmitting(true);
      const role = await apiClient<{ id: string }>('/admin/roles', { method: 'POST', body: data });
      // Assign selected permissions
      if (selectedPermissions.length > 0 && role.id) {
        const permRes = await apiClient<{ data: { id: string; code: string }[] }>('/admin/permissions');
        const perms = (permRes.data || []).filter((p: any) => selectedPermissions.includes(p.code));
        for (const perm of perms) {
          await apiClient('/admin/role-permissions', {
            method: 'POST',
            body: { roleId: role.id, permissionId: perm.id },
          });
        }
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create role:', error);
      alert('Failed to create role');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Create Role</h2>
          <button onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
            <input {...register('name')} className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Store Manager" />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description (Optional)</label>
            <textarea {...register('description')} rows={2} className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional description" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Permissions</label>
            <PermissionGrid selected={selectedPermissions} onChange={setSelectedPermissions} />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Create Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditProps {
  role: Role | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditRoleDialog({ role, onOpenChange, onSuccess }: EditProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdateRoleDto>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: { name: '', description: '' },
  });

  const loadRolePermissions = React.useCallback(async () => {
    if (!role) return;
    setLoadingPerms(true);
    try {
      const data = await apiClient<{ data: { role_id: string; permission_code: string }[] }>('/admin/role-permissions');
      const perms = (data.data || [])
        .filter((rp: any) => rp.role_id === role.id)
        .map((rp: any) => rp.permission_code)
        .filter(Boolean);
      setSelectedPermissions(perms);
    } catch (err) {
      console.error('Failed to load role permissions:', err);
    } finally {
      setLoadingPerms(false);
    }
  }, [role]);

  useEffect(() => {
    if (!role) return;
    reset({ name: role.name, description: role.description || '' });
    loadRolePermissions();
  }, [role, reset, loadRolePermissions]);

  const onSubmit = async (data: UpdateRoleDto) => {
    if (!role) return;
    try {
      setIsSubmitting(true);
      await apiClient(`/admin/roles/${role.id}`, { method: 'PATCH', body: data });

      // Sync permissions: get all current, diff, add/remove as needed
      const permRes = await apiClient<{ data: { id: string; code: string }[] }>('/admin/permissions');
      const allPerms = permRes.data || [];
      const currentPerms = await apiClient<{ data: { role_id: string; permission_id: string; permission_code: string }[] }>('/admin/role-permissions');
      const currentForRole = (currentPerms.data || []).filter((rp: any) => rp.role_id === role.id);
      const currentCodes = currentForRole.map((rp: any) => rp.permission_code).filter(Boolean);
      const currentPermIds = currentForRole.map((rp: any) => rp.permission_id).filter(Boolean);

      const toAdd = selectedPermissions.filter((c) => !currentCodes.includes(c));
      const toRemove = currentCodes.filter((c: string) => !selectedPermissions.includes(c));

      for (const code of toAdd) {
        const perm = allPerms.find((p: any) => p.code === code);
        if (perm) {
          await apiClient('/admin/role-permissions', { method: 'POST', body: { roleId: role.id, permissionId: perm.id } });
        }
      }

      // Remove permissions
      for (const code of toRemove) {
        const idx = currentCodes.indexOf(code);
        if (idx !== -1) {
          const pid = currentPermIds[idx];
          try {
            await apiClient('/admin/role-permissions', { method: 'DELETE', body: { roleId: role.id, permissionId: pid } });
          } catch { /* may not exist */ }
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update role');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!role) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Edit Role</h2>
          <button onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
            <input {...register('name')} className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
            <textarea {...register('description')} rows={2} className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Permissions</label>
            {loadingPerms ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-zinc-400" /></div>
            ) : (
              <PermissionGrid selected={selectedPermissions} onChange={setSelectedPermissions} />
            )}
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
