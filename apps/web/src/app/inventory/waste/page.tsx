'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { WasteTable } from '@/components/inventory/waste-table';

export default function WastePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-xl">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Waste Logs
            </h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-lg">
            Track discarded items, expired ingredients, and operational waste.
          </p>
        </header>

        <section>
          <WasteTable />
        </section>
      </div>
    </div>
  );
}
