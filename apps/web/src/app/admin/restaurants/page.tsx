'use client';

import React from 'react';
import { Store } from 'lucide-react';
import { RestaurantsTable } from '@/components/admin/restaurants-table';

export default function RestaurantsPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <Store className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Restaurants</h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-lg">
            Manage restaurants within franchise groups.
          </p>
        </header>
        <section>
          <RestaurantsTable />
        </section>
      </div>
    </div>
  );
}
