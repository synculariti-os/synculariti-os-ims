'use client';

import React, { useState, useEffect } from 'react';
import { itemApi } from '@/lib/api/item';
import { Scale, AlertCircle } from 'lucide-react';

interface UomConversionDialogProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function UomConversionDialog({ item, isOpen, onClose, onSaved }: UomConversionDialogProps) {
  const [fromUom, setFromUom] = useState('');
  const [toUom, setToUom] = useState('');
  const [factor, setFactor] = useState<number | ''>('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && item) {
      setFromUom('');
      setToUom(item.baseUom);
      setFactor('');
      setError(null);
    }
  }, [isOpen, item]);

  const handleSave = async () => {
    if (!fromUom || !toUom || !factor) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    try {
      await itemApi.upsertUomConversion({
        itemId: item.id,
        fromUom: fromUom.toUpperCase(),
        toUom: toUom.toUpperCase(),
        conversionFactor: Number(factor)
      });
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to update conversion');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">UOM Conversion</h2>
            <p className="text-sm text-zinc-500">Base Unit: {item.baseUom}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 flex gap-3 text-red-600 text-sm">
            <AlertCircle className="w-5 h-5" /> <p>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">From UOM</label>
              <input type="text" value={fromUom} onChange={e => setFromUom(e.target.value)} placeholder="e.g. CASE" className="w-full px-4 py-2 border rounded-xl uppercase" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">To UOM</label>
              <input type="text" value={toUom} disabled className="w-full px-4 py-2 border rounded-xl bg-zinc-50" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Multiplier</label>
            <input type="number" step="0.01" value={factor} onChange={e => setFactor(e.target.value === '' ? '' : Number(e.target.value))} placeholder="1 CASE = ? BASE" className="w-full px-4 py-2 border rounded-xl" />
            <p className="text-xs text-zinc-500 mt-2">Example: If 1 CASE contains 24 EA, multiplier is 24.</p>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm hover:bg-zinc-100 rounded-xl">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Save</button>
        </div>
      </div>
    </div>
  );
}
