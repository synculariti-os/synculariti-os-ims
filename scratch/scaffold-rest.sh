#!/bin/bash
set -e

# --- API Clients ---
cat << 'EOF' > apps/web/src/lib/api/tenant.ts
import { apiClient } from '../api-client';

export const tenantApi = {
  listRestaurants: async () => apiClient<{ data: any[] }>('/tenant/restaurants'),
  createRestaurant: async (dto: any) => apiClient<any>('/tenant/restaurants', { method: 'POST', body: dto }),
  updateRestaurant: async (id: string, dto: any) => apiClient<any>(`/tenant/restaurants/${id}`, { method: 'PUT', body: dto }),
  listFranchises: async () => apiClient<{ data: any[] }>('/tenant/franchise-groups'),
};
EOF

cat << 'EOF' > apps/web/src/lib/api/auth.ts
import { apiClient } from '../api-client';

export const authApi = {
  getMe: async () => apiClient<any>('/auth/me'),
  updateProfile: async (dto: any) => apiClient<any>('/auth/profile', { method: 'PATCH', body: dto }),
};
EOF

# --- Profile Page ---
mkdir -p apps/web/src/app/profile

cat << 'EOF' > apps/web/src/app/profile/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { User, Shield, Save, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    authApi.getMe().then(res => {
      setProfile(res);
      setFullName(res.fullName || '');
      setPhone(res.phoneNumber || '');
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await authApi.updateProfile({ full_name: fullName, phone_number: phone });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) return <div className="p-12 text-center text-zinc-500">Loading profile...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Profile Settings</h1>
          <p className="text-zinc-500">{profile.email}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Full Name</label>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full max-w-md px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Phone Number</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full max-w-md px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        
        <div className="pt-4 flex items-center gap-4">
          <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
          {success && <span className="text-emerald-600 flex items-center gap-1.5 text-sm"><CheckCircle className="w-4 h-4" /> Saved successfully</span>}
        </div>
      </div>

      <div className="mt-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-indigo-500" />
          Active Permissions
        </h3>
        <div className="flex flex-wrap gap-2">
          {profile.permissions?.map((p: string) => (
            <span key={p} className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 rounded-lg text-xs font-mono">{p}</span>
          ))}
          {!profile.permissions?.length && <span className="text-zinc-500 text-sm">No specific permissions assigned.</span>}
        </div>
      </div>
    </div>
  );
}
EOF

# --- Tenant Admin Page ---
mkdir -p apps/web/src/app/tenant/restaurants

cat << 'EOF' > apps/web/src/app/tenant/restaurants/page.tsx
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
EOF

# --- Snapshots Report ---
mkdir -p apps/web/src/app/reports/snapshots

cat << 'EOF' > apps/web/src/app/reports/snapshots/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Camera, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function SnapshotsReportPage() {
  const [snapshots, setSnapshots] = useState<any[]>([]);

  useEffect(() => {
    apiClient<{ data: any[] }>('/reports/snapshots').then(res => setSnapshots(res.data || []));
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 mt-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
          <Camera className="w-8 h-8 text-indigo-500" />
          End of Day Snapshots
        </h1>
        <p className="text-zinc-500 mt-2">Historical stock values recorded at close of business.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-sm">
            <tr>
              <th className="p-4 px-6 font-medium">Business Date</th>
              <th className="p-4 px-6 font-medium">Item Name</th>
              <th className="p-4 px-6 font-medium text-right">Ending Quantity</th>
              <th className="p-4 px-6 font-medium text-right">Unit Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {snapshots.map(s => (
              <tr key={s.id}>
                <td className="p-4 px-6 flex items-center gap-2"><Calendar className="w-4 h-4 text-zinc-400" /> {s.businessDate}</td>
                <td className="p-4 px-6 font-medium text-zinc-900 dark:text-white">{s.item?.name || s.itemId}</td>
                <td className="p-4 px-6 text-right tabular-nums">{s.quantity}</td>
                <td className="p-4 px-6 text-right tabular-nums text-indigo-600">${s.unitValue?.toFixed(2)}</td>
              </tr>
            ))}
            {snapshots.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-zinc-500">No snapshots recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
EOF

echo "Done scaffolding remaining pages."
