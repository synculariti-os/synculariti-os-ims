'use client';

import React from 'react';
import { Package } from 'lucide-react';
import { ItemsTable } from '@/components/items/items-table';

export default function ItemsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="mb-10 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Item Master
            </h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-lg">
            Manage your raw ingredients, prep items, packaging, and merchandise. All inventory starts here.
          </p>
        </header>

        <section>
          <ItemsTable />
        </section>
      </div>
    </div>
  );
}
