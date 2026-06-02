#!/bin/bash
set -e

mkdir -p apps/web/src/app/procurement/vendors

cat << 'EOF' > apps/web/src/app/procurement/vendors/page.tsx
'use client';

import React from 'react';
import { VendorsTable } from '@/components/procurement/vendors-table';
import { Store } from 'lucide-react';
import Link from 'next/link';

export default function VendorsPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] selection:bg-indigo-500/30">
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-4">
                <Store className="w-4 h-4" />
                <span>Vendor Directory</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
                Vendors
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400 max-w-2xl">
                Manage your suppliers, update contact details, and view purchase history.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 mt-6 border-b border-zinc-200 dark:border-zinc-800">
            <Link href="/procurement/orders" className="pb-3 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">
              Purchase Orders
            </Link>
            <div className="pb-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400">
              Vendors
            </div>
          </div>
        </div>

        <VendorsTable />
      </main>
    </div>
  );
}
EOF

cat << 'EOF' > apps/web/src/components/procurement/vendors-table.tsx
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
    (v.contactEmail && v.contactEmail.toLowerCase().includes(search.toLowerCase())) ||
    (v.contactPhone && v.contactPhone.toLowerCase().includes(search.toLowerCase()))
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
                        {vendor.contactPhone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 opacity-70" />
                            {vendor.contactPhone}
                          </div>
                        )}
                        {!vendor.contactEmail && !vendor.contactPhone && <span className="opacity-50">No contact info</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${vendor.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                        {vendor.active ? 'Active' : 'Inactive'}
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
EOF

cat << 'EOF' > apps/web/src/components/procurement/create-vendor-dialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { procurementApi } from '@/lib/api/procurement';
import { Store, AlertCircle } from 'lucide-react';
import { Vendor } from '@ims/types';

interface CreateVendorDialogProps {
  isOpen: boolean;
  vendor?: Vendor | null;
  onClose: () => void;
  onSaved: () => void;
}

export function CreateVendorDialog({ isOpen, vendor, onClose, onSaved }: CreateVendorDialogProps) {
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [active, setActive] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(vendor?.name || '');
      setContactName(vendor?.contactName || '');
      setContactEmail(vendor?.contactEmail || '');
      setContactPhone(vendor?.contactPhone || '');
      setActive(vendor ? vendor.active : true);
      setError(null);
    }
  }, [isOpen, vendor]);

  const handleSave = async () => {
    try {
      setError(null);
      if (!name) throw new Error('Vendor name is required.');
      
      setIsSaving(true);
      const dto = { name, contactName, contactEmail, contactPhone, active };
      
      if (vendor) {
        await procurementApi.updateVendor(vendor.id, dto);
      } else {
        await procurementApi.createVendor(dto);
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save vendor');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {vendor ? 'Edit Vendor' : 'New Vendor'}
            </h2>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex gap-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Company Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Contact Person</label>
            <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Email</label>
              <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Phone</label>
              <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white" />
            </div>
          </div>
          {vendor && (
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="active" checked={active} onChange={e => setActive(e.target.checked)} className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500" />
              <label htmlFor="active" className="text-sm text-zinc-700 dark:text-zinc-300">Active Vendor</label>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-transparent text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving || !name} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save Vendor'}
          </button>
        </div>
      </div>
    </div>
  );
}
EOF

echo "Done scaffolding vendors UI"
