'use client';

import React, { useState } from 'react';
import { StockTable } from '@/components/inventory/stock-table';
import { LedgerTable } from '@/components/inventory/ledger-table';
import { PackageSearch, Boxes, History, ClipboardList, Trash2, ChefHat, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState<'stock' | 'ledger'>('stock');

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] bg-[url('/grid.svg')] dark:bg-[url('/grid-dark.svg')] bg-center selection:bg-indigo-500/30">
      <main className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-6">
                <PackageSearch className="w-4 h-4" />
                <span>Inventory Dashboard</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight mb-4">
                Real-time Stock Levels
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
                Monitor your current inventory, view historical stock movements, and track deductions powered by automated BOM expansion.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/inventory/counts" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm">
                <ClipboardList className="w-4 h-4 text-emerald-500" />
                Counts
              </Link>
              <Link href="/inventory/waste" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm">
                <Trash2 className="w-4 h-4 text-red-500" />
                Waste
              </Link>
              <Link href="/inventory/prep" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm">
                <ChefHat className="w-4 h-4 text-blue-500" />
                Prep Batch
              </Link>
              <Link href="/inventory/transfers" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm">
                <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
                Transfers
              </Link>
            </div>
          </header>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-px">
            <button
              onClick={() => setActiveTab('stock')}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative",
                activeTab === 'stock' 
                  ? "text-indigo-600 dark:text-indigo-400" 
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              <Boxes className="w-4 h-4" />
              Current Stock
              {activeTab === 'stock' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative",
                activeTab === 'ledger' 
                  ? "text-amber-600 dark:text-amber-400" 
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              <History className="w-4 h-4" />
              Transaction Ledger
              {activeTab === 'ledger' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-600 dark:bg-amber-400 rounded-t-full" />
              )}
            </button>
          </div>

          {activeTab === 'stock' ? <StockTable /> : <LedgerTable />}

        </div>
      </main>
    </div>
  );
}
