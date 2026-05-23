'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { RecipesTable } from '@/components/recipes/recipes-table';

export default function RecipesPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="mb-10 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Recipes & Bill of Materials
            </h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-lg">
            Define how raw ingredients combine to create prep items. Essential for accurate inventory depletion.
          </p>
        </header>

        <section>
          <RecipesTable />
        </section>
      </div>
    </div>
  );
}
