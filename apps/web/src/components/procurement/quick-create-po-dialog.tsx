'use client';

import React, { useState, useEffect } from 'react';
import { procurementApi } from '@/lib/api/procurement';
import { ShoppingCart, PackageOpen, AlertCircle } from 'lucide-react';
import { Vendor } from '@ims/types';

interface QuickCreatePoDialogProps {
  itemId: string;
  itemName: string;
  suggestedQuantity: number;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickCreatePoDialog({
  itemId,
  itemName,
  suggestedQuantity,
  isOpen,
  onClose,
}: QuickCreatePoDialogProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(suggestedQuantity);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuantity(suggestedQuantity);
      setUnitPrice(0);
      setSelectedVendorId('');
      setError(null);
      fetchVendors();
    }
  }, [isOpen, suggestedQuantity]);

  const fetchVendors = async () => {
    setIsLoadingVendors(true);
    try {
      const response = await procurementApi.listVendors();
      setVendors(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load vendors');
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const handleCreatePo = async () => {
    try {
      setError(null);
      if (!selectedVendorId) throw new Error('Please select a vendor.');
      if (quantity <= 0) throw new Error('Quantity must be greater than zero.');
      
      setIsCreating(true);
      await procurementApi.createDraftPO({
        vendorId: selectedVendorId,
        freightCharge: 0,
        taxAmount: 0,
        discountAmount: 0,
        lineItems: [
          {
            itemId,
            quantityOrdered: quantity,
            rawUnitPrice: unitPrice,
          },
        ],
      });
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to create PO');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Quick Create PO</h2>
            <p className="text-sm text-zinc-500">Order <span className="font-medium text-zinc-900 dark:text-zinc-300">{itemName}</span></p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex gap-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Vendor
            </label>
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              disabled={isLoadingVendors || isCreating}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all text-zinc-900 dark:text-white disabled:opacity-50"
            >
              <option value="" disabled>Select a vendor...</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            {vendors.length === 0 && !isLoadingVendors && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                No active vendors found. You must create a vendor first.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Quantity to Order
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                disabled={isCreating}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Unit Price
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                disabled={isCreating}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-zinc-900 dark:text-white"
              />
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
            disabled={isCreating || !selectedVendorId || quantity <= 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isCreating ? 'Creating...' : 'Create Draft PO'}
          </button>
        </div>
      </div>
    </div>
  );
}
