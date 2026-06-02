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
