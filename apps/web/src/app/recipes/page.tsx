'use client';

import React, { useState } from 'react';
import { Layers, Map } from 'lucide-react';
import { RecipesTable } from '@/components/recipes/recipes-table';
import { MappingsTab } from '@/components/recipes/mappings-tab';
import { cn } from '@/lib/utils';

type Tab = 'recipes' | 'mappings';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'recipes', label: 'Bill of Materials', icon: Layers },
  { id: 'mappings', label: 'POS Mappings', icon: Map },
];

export default function RecipesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('recipes');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        <header className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Recipes & POS Mapping
            </h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-lg">
            Define Bills of Materials with ingredients and sub-recipes. Map POS item names to BOMs for automatic inventory depletion.
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-1 w-fit shadow-sm">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                activeTab === id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-blue-900/40'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <section>
          {activeTab === 'recipes' && <RecipesTable />}
          {activeTab === 'mappings' && <MappingsTab />}
        </section>
      </div>
    </div>
  );
}
