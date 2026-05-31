'use client';

import React from 'react';
import { Truck } from 'lucide-react';
import { OrdersTable } from '@/components/procurement/orders-table';

export default function ProcurementOrdersPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        <header className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
              <Truck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Purchase Orders
            </h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-lg">
            Manage your procurement pipeline, submit orders to vendors, and receive inventory.
          </p>
        </header>

        <section>
          <OrdersTable />
        </section>
      </div>
    </div>
  );
}
