'use client';

import React, { useEffect, useState } from 'react';
import { tenantApi } from '@/lib/api/tenant';
import { Building2, Plus, Edit } from 'lucide-react';

export default function TenantRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  
  useEffect(() => {
    tenantApi.listRestaurants().then(res => setRestaurants(res.data || []));
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 mt-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-500" />
            Restaurant Management
          </h1>
          <p className="text-zinc-500 mt-2">Manage locations and franchise associations.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Location
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-sm">
            <tr>
              <th className="p-4 px-6 font-medium">Name</th>
              <th className="p-4 px-6 font-medium">Timezone</th>
              <th className="p-4 px-6 font-medium">Status</th>
              <th className="p-4 px-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {restaurants.map(r => (
              <tr key={r.id}>
                <td className="p-4 px-6 font-medium text-zinc-900 dark:text-white">{r.name}</td>
                <td className="p-4 px-6 text-zinc-600 dark:text-zinc-400">{r.timezone}</td>
                <td className="p-4 px-6"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs">Active</span></td>
                <td className="p-4 px-6 text-right"><button className="text-zinc-400 hover:text-indigo-500"><Edit className="w-4 h-4" /></button></td>
              </tr>
            ))}
            {restaurants.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-zinc-500">No restaurants found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
