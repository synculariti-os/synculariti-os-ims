'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { ParAlertRow } from '@ims/types';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function ParAlertsWidget() {
  const [alerts, setAlerts] = useState<ParAlertRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<{ data: ParAlertRow[] }>('/reports/par-alerts')
      .then((res) => setAlerts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-64 animate-pulse bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800" />;

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-xl">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Critical Shortages</h3>
      </div>
      
      {alerts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-sm">
          All items are well stocked!
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          {alerts.slice(0, 5).map((alert) => (
            <div key={alert.item.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate" title={alert.item.name}>{alert.item.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  Par: {alert.item.effectiveParLevel || 0} • Stock: {alert.currentStock}
                </p>
              </div>
              <div className="text-sm font-semibold text-red-600 dark:text-red-400 shrink-0">
                Short by {Math.abs(alert.varianceFromPar)}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <Link href="/procurement/orders" className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-medium transition-colors">
        Create PO
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
