'use client';

import React, { useState } from 'react';
import { FranchiseGroup } from '@ims/types';
import { apiClient } from '@/lib/api-client';
import { X, Loader2 } from 'lucide-react';

interface CreateProps {
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateFranchiseGroupDialog({ onOpenChange, onSuccess }: CreateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    try {
      setIsSubmitting(true);
      await apiClient('/tenant/franchise-groups', { method: 'POST', body: { name: name.trim() } });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create franchise group:', error);
      alert('Failed to create franchise group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Create Franchise Group</h2>
          <button onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
            <input value={name} onChange={(e) => { setName(e.target.value); setError(''); }} className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. North Region" />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditProps {
  group: FranchiseGroup | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditFranchiseGroupDialog({ group, onOpenChange, onSuccess }: EditProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (group) setName(group.name);
  }, [group]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;
    if (!name.trim()) { setError('Name is required'); return; }
    try {
      setIsSubmitting(true);
      await apiClient(`/tenant/franchise-groups/${group.id}`, { method: 'PATCH', body: { name: name.trim() } });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update franchise group:', error);
      alert('Failed to update franchise group');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!group) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Edit Franchise Group</h2>
          <button onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
            <input value={name} onChange={(e) => { setName(e.target.value); setError(''); }} className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
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
