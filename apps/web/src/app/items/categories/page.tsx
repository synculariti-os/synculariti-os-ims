'use client';

import React from 'react';
import { Tag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CategoriesTable } from '@/components/items/categories-table';

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div>
          <Link href="/items" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Item Master
          </Link>
          
          <header className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                <Tag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Categories
              </h1>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-lg">
              Manage product categories to organize your inventory effectively.
            </p>
          </header>
        </div>

        <section>
          <CategoriesTable />
        </section>
      </div>
    </div>
  );
}
