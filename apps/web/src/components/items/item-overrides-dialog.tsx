'use client';

import React, { useState, useEffect } from 'react';
import { itemApi } from '@/lib/api/item';
import { Settings2, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/use-auth-store';

interface ItemOverridesDialogProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ItemOverridesDialog({ item, isOpen, onClose, onSaved }: ItemOverridesDialogProps) {
  const [parLevel, setParLevel] = useState<number | ''>('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const restaurantId = useAuthStore(state => state.restaurantId);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen && item) {
      setParLevel(item.overrideParLevel ?? '');
      setActive(item.overrideActive ?? true);
      setError(null);
    }
  }, [isOpen, item]);

  const updateMutation = useMutation({
    mutationFn: () => itemApi.updateOverride(item.id, {
      parLevel: parLevel === '' ? null : Number(parLevel),
      active
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', restaurantId] });
      onSaved();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update override');
    }
  });

  const handleSave = () => {
    setError(null);
    updateMutation.mutate();
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Overrides</h2>
            <p className="text-sm text-zinc-500">{item.name}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 flex gap-3 text-red-600 text-sm">
            <AlertCircle className="w-5 h-5" /> <p>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Par Level</label>
            <input type="number" step="0.1" value={parLevel} onChange={e => setParLevel(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Global default if empty" className="w-full px-4 py-2 border rounded-xl" />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" id="activeOverride" checked={active} onChange={e => setActive(e.target.checked)} className="w-4 h-4 rounded text-indigo-600" />
            <label htmlFor="activeOverride" className="text-sm font-medium">Active in this restaurant</label>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} disabled={updateMutation.isPending} className="px-4 py-2 text-sm hover:bg-zinc-100 rounded-xl">Cancel</button>
          <button onClick={handleSave} disabled={updateMutation.isPending} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Save Changes</button>
        </div>
      </div>
    </div>
  );
}
