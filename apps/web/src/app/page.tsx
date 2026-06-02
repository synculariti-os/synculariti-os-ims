'use client';

import { ParAlertsWidget } from '@/components/dashboard/par-alerts-widget';
import { PendingDeliveriesWidget } from '@/components/dashboard/pending-deliveries-widget';
import { OpenCountsWidget } from '@/components/dashboard/open-counts-widget';
import { RecentImportsWidget } from '@/components/dashboard/recent-imports-widget';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Operations Dashboard</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-lg">
          At-a-glance view of tasks that need your attention today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <ParAlertsWidget />
        <PendingDeliveriesWidget />
        <OpenCountsWidget />
        <RecentImportsWidget />
      </div>
    </div>
  );
}
