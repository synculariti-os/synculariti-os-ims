'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { VarianceTable } from '@/components/reports/variance-table';

export default function VariancePage() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] bg-[url('/grid.svg')] dark:bg-[url('/grid-dark.svg')] bg-center selection:bg-indigo-500/30">
      <main className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <Link href="/reports" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors mb-4">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Reports
              </Link>
              <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight mb-4">
                Variance Analytics
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
                Compare theoretical usage against actual physical counts.
              </p>
            </div>
          </header>

          <VarianceTable />

        </div>
      </main>
    </div>
  );
}
