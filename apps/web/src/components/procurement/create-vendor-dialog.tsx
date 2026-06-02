'use client';

import React, { useState, useEffect } from 'react';
import { procurementApi } from '@/lib/api/procurement';
import { Store, AlertCircle } from 'lucide-react';
import { Vendor } from '@ims/types';
import { useAuthStore } from '@/store/use-auth-store';

interface CreateVendorDialogProps {
  isOpen: boolean;
  vendor?: Vendor | null;
  onClose: () => void;
  onSaved: () => void;
}

export function CreateVendorDialog({ isOpen, vendor, onClose, onSaved }: CreateVendorDialogProps) {
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isActive, setIsActive] = useState(true);
  const restaurantId = useAuthStore(s => s.restaurantId);
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(vendor?.name || '');
      setContactEmail(vendor?.contactEmail || '');
      setIsActive(vendor ? vendor.isActive : true);
      setError(null);
    }
  }, [isOpen, vendor]);

  const handleSave = async () => {
    try {
      setError(null);
      if (!name) throw new Error('Vendor name is required.');
      
      setIsSaving(true);
      const dto = { 
        name, 
        contactEmail: contactEmail || null, 
        isActive,
        restaurantId,
        franchiseGroupId: null
      };
      
      if (vendor) {
        await procurementApi.updateVendor(vendor.id, dto as any);
      } else {
        await procurementApi.createVendor(dto as any);
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
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Email</label>
            <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white" />
          </div>
          {vendor && (
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500" />
              <label htmlFor="isActive" className="text-sm text-zinc-700 dark:text-zinc-300">Active Vendor</label>
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
