'use client';

import React, { useEffect, useState } from 'react';
import { Role, Restaurant } from '@ims/types';
import { apiClient } from '@/lib/api-client';
import { Users, Plus, Search, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { CreateAssignmentDialog } from './assignment-dialogs';

interface Assignment {
  userId: string;
  restaurantId: string;
  roleId: string;
  email?: string;
  fullName?: string;
  restaurantName?: string;
  roleName?: string;
}

export function UserAssignmentsTable() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingAssign, setDeletingAssign] = useState<Assignment | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [assignRes, userRes, roleRes, restRes] = await Promise.all([
        apiClient<{ data: Assignment[] }>('/admin/user-restaurant-roles'),
        apiClient<{ data: any[] }>('/admin/users'),
        apiClient<{ data: Role[] }>('/admin/roles'),
        apiClient<{ data: Restaurant[] }>('/tenant/restaurants'),
      ]);
      setAssignments(assignRes.data || []);
      setUsers(userRes.data || []);
      setRoles(roleRes.data || []);
      setRestaurants(restRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const userMap = Object.fromEntries(users.map((u: any) => [u.id, u]));
  const roleMap = Object.fromEntries(roles.map((r) => [r.id, r]));
  const restMap = Object.fromEntries(restaurants.map((r) => [r.id, r]));

  const filtered = assignments.filter((a) => {
    const u = userMap[a.userId] || {};
    const r = restMap[a.restaurantId] || {};
    const ro = roleMap[a.roleId] || {};
    const q = searchQuery.toLowerCase();
    return (
      (u.full_name || u.fullName || a.fullName || '').toLowerCase().includes(q) ||
      (u.email || a.email || '').toLowerCase().includes(q) ||
      (r.name || a.restaurantName || '').toLowerCase().includes(q) ||
      (ro.name || a.roleName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input type="text" placeholder="Search by user, restaurant, or role..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors whitespace-nowrap shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Assign User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Restaurant</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center"><div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                <Users className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">No assignments found</p>
                <p className="mt-1 mb-4">Assign users to restaurants with a role.</p>
                <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"><Plus className="w-4 h-4 mr-2" /> Assign User</button>
              </td></tr>
            ) : (
              filtered.map((a) => {
                const u = userMap[a.userId] || {};
                const r = restMap[a.restaurantId] || {};
                const ro = roleMap[a.roleId] || {};
                return (
                  <tr key={`${a.userId}-${a.restaurantId}-${a.roleId}`} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{(u.full_name || u.fullName || a.fullName || a.userId.slice(0, 8))}</td>
                    <td className="px-6 py-4 text-zinc-500">{u.email || a.email || a.userId}</td>
                    <td className="px-6 py-4 text-zinc-500">{r.name || a.restaurantName || a.restaurantId.slice(0, 8)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {ro.name || a.roleName || a.roleId.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" onClick={() => setDeletingAssign(a)} title="Remove assignment"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isCreateOpen && (
        <CreateAssignmentDialog
          restaurants={restaurants}
          roles={roles}
          onOpenChange={setIsCreateOpen}
          onSuccess={fetchData}
        />
      )}

      {deletingAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDeletingAssign(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-zinc-200 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Remove Assignment</h3>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">Remove this user&apos;s access to the restaurant?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeletingAssign(null)} className="px-4 py-2 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
              <button onClick={async () => {
                try {
                  await apiClient('/admin/user-restaurant-roles', {
                    method: 'DELETE',
                    body: { userId: deletingAssign.userId, restaurantId: deletingAssign.restaurantId, roleId: deletingAssign.roleId },
                  });
                  setDeletingAssign(null);
                  fetchData();
                } catch (err) { console.error('Failed to delete assignment', err); }
              }} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
