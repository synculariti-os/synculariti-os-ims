'use client';

import React, { useEffect, useState } from 'react';
import { FranchiseGroup, PERMISSION_CODES } from '@ims/types';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/use-auth-store';
import { useHasHydrated } from '@/hooks/use-has-hydrated';
import { Building2, Plus, Search, Pencil, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { CreateFranchiseGroupDialog, EditFranchiseGroupDialog } from './franchise-group-dialogs';

function ConfirmDeleteModal({ onConfirm, onCancel, name, error, isDeleting }: { onConfirm: () => void; onCancel: () => void; name: string; error: string | null; isDeleting: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-zinc-200 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Franchise Group</h3>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">Delete <span className="font-semibold text-zinc-900 dark:text-white">{name}</span>? This cannot be undone. Restaurants under this group will not be deleted.</p>
        {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={isDeleting} className="px-4 py-2 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={isDeleting} className="flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50">
            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function FranchiseGroupsTable() {
  const [groups, setGroups] = useState<FranchiseGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FranchiseGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<FranchiseGroup | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmBulk, setDeleteConfirmBulk] = useState(false);
  const isHydrated = useHasHydrated();
  const hasPermRaw = useAuthStore((s) => s.hasPermission);
  const hasPerm = (code: any) => isHydrated && hasPermRaw(code);
  const canManage = hasPerm(PERMISSION_CODES.ADMIN_TENANTS);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient<{ data: FranchiseGroup[] }>('/tenant/franchise-groups');
      setGroups(response.data || []);
    } catch (error) {
      console.error('Failed to fetch franchise groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allFilteredSelected = filtered.length > 0 && filtered.every((v) => selectedIds.has(v.id));

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((v) => v.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      await apiClient('/tenant/franchise-groups/bulk-delete', {
        method: 'POST',
        body: { ids: Array.from(selectedIds) },
      });
      setDeleteConfirmBulk(false);
      setSelectedIds(new Set());
      fetchGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to delete franchise groups');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search franchise groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors whitespace-nowrap shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Group
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/10 border-b border-red-200 dark:border-red-800/30">
          <span className="text-sm font-medium text-red-700 dark:text-red-400">
            {selectedIds.size} selected
          </span>
          <button
            onClick={() => setDeleteConfirmBulk(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete Selected
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 ml-auto transition-colors"
          >
            Clear selection
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-4 w-10">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={handleSelectAll}
                  className="rounded border-zinc-300 dark:border-zinc-600"
                />
              </th>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">ID</th>
              <th className="px-6 py-4 font-medium">Created</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center"><div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                <Building2 className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">No franchise groups found</p>
                <p className="mt-1 mb-4">Create your first franchise group.</p>
                <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"><Plus className="w-4 h-4 mr-2" /> Add Group</button>
              </td></tr>
            ) : (
              filtered.map((g) => (
                <tr key={g.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(g.id)}
                      onChange={() => handleSelectOne(g.id)}
                      className="rounded border-zinc-300 dark:border-zinc-600"
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{g.name}</td>
                  <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{g.id}</td>
                  <td className="px-6 py-4 text-zinc-500">{new Date(g.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" onClick={() => setEditingGroup(g)} title="Edit"><Pencil className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" onClick={() => setDeletingGroup(g)} title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isCreateOpen && <CreateFranchiseGroupDialog onOpenChange={setIsCreateOpen} onSuccess={fetchGroups} />}
      {editingGroup && <EditFranchiseGroupDialog group={editingGroup} onOpenChange={(o) => !o && setEditingGroup(null)} onSuccess={fetchGroups} />}
      {deletingGroup && (
        <ConfirmDeleteModal
          name={deletingGroup.name}
          error={deleteError}
          isDeleting={isDeleting}
          onConfirm={async () => {
            setDeleteError(null);
            setIsDeleting(true);
            try {
              await apiClient(`/tenant/franchise-groups/${deletingGroup.id}`, { method: 'DELETE' });
              setDeletingGroup(null);
              setDeleteError(null);
              fetchGroups();
            } catch (err) {
              setDeleteError(err instanceof Error ? err.message : 'Failed to delete franchise group');
            } finally {
              setIsDeleting(false);
            }
          }}
          onCancel={() => { setDeletingGroup(null); setDeleteError(null); }}
        />
      )}

      {deleteConfirmBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteConfirmBulk(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-zinc-200 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Delete Franchise Groups</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              Are you sure you want to delete <strong className="text-zinc-900 dark:text-zinc-100">{selectedIds.size}</strong> franchise group{selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone. Restaurants under these groups will not be deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmBulk(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="flex items-center px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete {selectedIds.size}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
