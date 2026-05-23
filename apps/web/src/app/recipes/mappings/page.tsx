'use client';

import React from 'react';
import { Link } from 'lucide-react';
import { MappingsTable } from '@/components/recipes/mappings-table';

export default function POSMappingsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="mb-10 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
              <Link className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              POS Strings Mapping
            </h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-lg">
            Map exact strings from your POS system to internal IMS recipes for automatic sales ingestion and inventory depletion.
          </p>
        </header>

        <section>
          <MappingsTable />
        </section>
      </div>
    </div>
  );
}
