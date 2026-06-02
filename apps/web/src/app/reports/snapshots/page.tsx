'use client';

import React, { useEffect, useState } from 'react';
import { Camera, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function SnapshotsReportPage() {
  const [snapshots, setSnapshots] = useState<any[]>([]);

  useEffect(() => {
    apiClient<{ data: any[] }>('/reports/snapshots').then(res => setSnapshots(res.data || []));
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 mt-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
          <Camera className="w-8 h-8 text-indigo-500" />
          End of Day Snapshots
        </h1>
        <p className="text-zinc-500 mt-2">Historical stock values recorded at close of business.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 text-sm">
            <tr>
              <th className="p-4 px-6 font-medium">Business Date</th>
              <th className="p-4 px-6 font-medium">Item Name</th>
              <th className="p-4 px-6 font-medium text-right">Ending Quantity</th>
              <th className="p-4 px-6 font-medium text-right">Unit Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {snapshots.map(s => (
              <tr key={s.id}>
                <td className="p-4 px-6 flex items-center gap-2"><Calendar className="w-4 h-4 text-zinc-400" /> {s.businessDate}</td>
                <td className="p-4 px-6 font-medium text-zinc-900 dark:text-white">{s.item?.name || s.itemId}</td>
                <td className="p-4 px-6 text-right tabular-nums">{s.quantity}</td>
                <td className="p-4 px-6 text-right tabular-nums text-indigo-600">${s.unitValue?.toFixed(2)}</td>
              </tr>
            ))}
            {snapshots.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-zinc-500">No snapshots recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
