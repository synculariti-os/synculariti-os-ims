'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import { RolesTable } from '@/components/admin/roles-table';

export default function RolesPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Roles</h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-lg">
            Define roles and assign permission sets.
          </p>
        </header>
        <section>
          <RolesTable />
        </section>
      </div>
    </div>
  );
}
