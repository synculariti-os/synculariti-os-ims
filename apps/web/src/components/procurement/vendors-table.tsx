'use client';

import React, { useEffect, useState } from 'react';
import { Vendor } from '@ims/types';
import { procurementApi } from '@/lib/api/procurement';
import { Store, Search, Plus, Edit, Phone, Mail } from 'lucide-react';
import { CreateVendorDialog } from './create-vendor-dialog';

export function VendorsTable() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      const res = await procurementApi.listVendors();
      setVendors(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) || 
    (v.contactEmail && v.contactEmail.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4 mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          New Vendor
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Vendor Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Contact Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500 text-sm">Loading vendors...</td></tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-sm flex flex-col items-center justify-center gap-2">
                    <Store className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                    <span>No vendors found</span>
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                          <Store className="w-4 h-4" />
                        </div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-white">{vendor.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {vendor.contactEmail && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 opacity-70" />
                            {vendor.contactEmail}
                          </div>
                        )}
                        {!vendor.contactEmail && <span className="opacity-50">No contact info</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${vendor.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => setEditingVendor(vendor)} className="p-2 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <CreateVendorDialog
        isOpen={isCreateOpen || !!editingVendor}
        vendor={editingVendor}
        onClose={() => { setIsCreateOpen(false); setEditingVendor(null); }}
        onSaved={() => {
          setIsCreateOpen(false);
          setEditingVendor(null);
          fetchVendors();
        }}
      />
    </div>
  );
}
