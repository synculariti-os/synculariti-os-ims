'use client';

import React, { useEffect, useState } from 'react';
import { Role, PermissionCode, PERMISSION_CODES } from '@ims/types';
import { apiClient } from '@/lib/api-client';
import { Shield, Plus, Search, Pencil, AlertTriangle, X, Loader2 } from 'lucide-react';
import { CreateRoleDialog, EditRoleDialog } from './role-dialogs';

function PermissionsModal({ role, onClose }: { role: Role; onClose: () => void }) {
  const [permissions, setPermissions] = useState<{ code: string; description: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient<{ data: { role_id: string; permission_code: string; permission_name: string }[] }>('/admin/role-permissions');
        setPermissions(
          (data.data || [])
            .filter((rp: any) => rp.role_id === role.id)
            .map((rp: any) => ({ code: rp.permission_code, description: rp.permission_name }))
        );
      } catch (err) {
        console.error('Failed to load permissions:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [role.id]);

  const labels: Record<string, string> = {
    [PERMISSION_CODES.INVENTORY_READ]: 'Read Inventory',
    [PERMISSION_CODES.INVENTORY_WRITE]: 'Write Inventory',
    [PERMISSION_CODES.INVENTORY_COUNT]: 'Inventory Counts',
    [PERMISSION_CODES.PROCUREMENT_READ]: 'Read Procurement',
    [PERMISSION_CODES.PROCUREMENT_WRITE]: 'Write Procurement',
    [PERMISSION_CODES.RECIPE_READ]: 'Read Recipes',
    [PERMISSION_CODES.RECIPE_WRITE]: 'Write Recipes',
    [PERMISSION_CODES.SALES_IMPORT]: 'Sales Import',
    [PERMISSION_CODES.SALES_READ]: 'Read Sales',
    [PERMISSION_CODES.REPORTING_READ]: 'Read Reports',
    [PERMISSION_CODES.ADMIN_USERS]: 'Manage Users',
    [PERMISSION_CODES.ADMIN_ROLES]: 'Manage Roles',
    [PERMISSION_CODES.ADMIN_TENANTS]: 'Manage Tenants',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-zinc-200 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Permissions: {role.name}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent" /></div>
        ) : permissions.length === 0 ? (
          <p className="text-zinc-500 text-sm py-4 text-center">No permissions assigned</p>
        ) : (
          <div className="space-y-2">
            {permissions.map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <span className="text-sm font-medium text-zinc-900 dark:text-white">{p.code}</span>
                <span className="text-xs text-zinc-500">{labels[p.code] || p.description || ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function RolesTable() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [viewingPermsRole, setViewingPermsRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient<{ data: Role[] }>('/admin/roles');
      setRoles(response.data || []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const filtered = roles.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input type="text" placeholder="Search roles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors whitespace-nowrap shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Role
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Description</th>
              <th className="px-6 py-4 font-medium">Created</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center"><div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                <Shield className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">No roles found</p>
                <p className="mt-1 mb-4">Create your first role.</p>
                <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"><Plus className="w-4 h-4 mr-2" /> Add Role</button>
              </td></tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{r.name}</td>
                  <td className="px-6 py-4 text-zinc-500">{r.description || '-'}</td>
                  <td className="px-6 py-4 text-zinc-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-xs font-medium" onClick={() => setViewingPermsRole(r)} title="View Permissions">Perms</button>
                      <button className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" onClick={() => setEditingRole(r)} title="Edit"><Pencil className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" onClick={() => setDeletingRole(r)} title="Delete"><X className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isCreateOpen && <CreateRoleDialog onOpenChange={setIsCreateOpen} onSuccess={fetchRoles} />}
      {editingRole && <EditRoleDialog role={editingRole} onOpenChange={(o) => !o && setEditingRole(null)} onSuccess={fetchRoles} />}
      {viewingPermsRole && <PermissionsModal role={viewingPermsRole} onClose={() => setViewingPermsRole(null)} />}
      {deletingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDeletingRole(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-zinc-200 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Role</h3>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">Delete <span className="font-semibold text-zinc-900 dark:text-white">{deletingRole.name}</span>? Users with this role will lose their permissions.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeletingRole(null)} className="px-4 py-2 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
              <button onClick={async () => {
                try {
                  await apiClient(`/admin/roles/${deletingRole.id}`, { method: 'DELETE' });
                  setDeletingRole(null);
                  fetchRoles();
                } catch (err) { console.error('Failed to delete', err); }
              }} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
