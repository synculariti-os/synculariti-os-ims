'use client';

import React, { useState, useEffect } from 'react';
import { procurementApi } from '@/lib/api/procurement';
import { ShoppingCart, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Vendor, ItemWithOverride } from '@ims/types';
import { itemApi } from '@/lib/api/item';

interface CreatePoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreatePoDialog({ isOpen, onClose, onCreated }: CreatePoDialogProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<ItemWithOverride[]>([]);
  
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [lineItems, setLineItems] = useState<{ itemId: string; quantityOrdered: number; rawUnitPrice: number }[]>([
    { itemId: '', quantityOrdered: 1, rawUnitPrice: 0 }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedVendorId('');
      setLineItems([{ itemId: '', quantityOrdered: 1, rawUnitPrice: 0 }]);
      setError(null);
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [vRes, iRes] = await Promise.all([
        procurementApi.listVendors(),
        itemApi.listItems()
      ]);
      setVendors(vRes.data);
      setItems(iRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load vendors/items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLine = () => {
    setLineItems([...lineItems, { itemId: '', quantityOrdered: 1, rawUnitPrice: 0 }]);
  };

  const handleRemoveLine = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleUpdateLine = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    (updated[index] as any)[field] = value;
    setLineItems(updated);
  };

  const handleCreatePo = async () => {
    try {
      setError(null);
      if (!selectedVendorId) throw new Error('Please select a vendor.');
      
      const validLines = lineItems.filter(l => l.itemId && l.quantityOrdered > 0);
      if (validLines.length === 0) throw new Error('Add at least one valid line item.');
      
      setIsCreating(true);
      await procurementApi.createDraftPO({
        vendorId: selectedVendorId,
        freightCharge: 0,
        taxAmount: 0,
        discountAmount: 0,
        lineItems: validLines,
      });
      onCreated();
    } catch (error: any) {
      setError(error.message || 'Failed to create PO');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Create Draft PO</h2>
            <p className="text-sm text-zinc-500">Draft a new purchase order for a vendor.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex gap-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Vendor
            </label>
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              disabled={isLoading || isCreating}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all text-zinc-900 dark:text-white disabled:opacity-50"
            >
              <option value="" disabled>Select a vendor...</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Line Items
              </label>
              <button 
                onClick={handleAddLine}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {lineItems.map((line, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <select
                      value={line.itemId}
                      onChange={(e) => handleUpdateLine(index, 'itemId', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white"
                    >
                      <option value="" disabled>Select Item</option>
                      {items.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24 shrink-0">
                    <input
                      type="number"
                      min="0.1" step="0.1"
                      placeholder="Qty"
                      value={line.quantityOrdered || ''}
                      onChange={(e) => handleUpdateLine(index, 'quantityOrdered', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div className="w-28 shrink-0">
                    <input
                      type="number"
                      min="0" step="0.01"
                      placeholder="Price"
                      value={line.rawUnitPrice || ''}
                      onChange={(e) => handleUpdateLine(index, 'rawUnitPrice', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveLine(index)}
                    className="p-2 mt-0.5 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="px-4 py-2 bg-transparent text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreatePo}
            disabled={isCreating || !selectedVendorId}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isCreating ? 'Creating...' : 'Create Draft PO'}
          </button>
        </div>
      </div>
    </div>
  );
}
