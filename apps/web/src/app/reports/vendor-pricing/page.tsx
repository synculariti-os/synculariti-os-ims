'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { reportsApi } from '@/lib/api/reports';
import { apiClient } from '@/lib/api-client';
import { VendorPriceHistoryRow, ItemWithOverride } from '@ims/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ArrowLeft, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function VendorPricingPage() {
  const searchParams = useSearchParams();
  const itemId = searchParams.get('itemId');

  const [data, setData] = useState<VendorPriceHistoryRow[]>([]);
  const [item, setItem] = useState<ItemWithOverride | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!itemId) {
      setError('No item ID provided in URL.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const [historyRes, itemRes] = await Promise.all([
        reportsApi.getVendorPriceHistory(itemId),
        apiClient<{ data: ItemWithOverride }>(`/items/${itemId}`)
      ]);

      setData(historyRes.data);
      setItem(itemRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load vendor pricing data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [itemId]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const chartData = useMemo(() => {
    // We need to group by date to show multiple vendor lines on the same chart,
    // or we can just transform the array so Recharts can consume it.
    // Recharts expects an array of objects like: { date: 'Jan 1', vendorA: 10, vendorB: 12 }
    
    const aggregated: Record<string, any> = {};
    const vendors = new Set<string>();

    data.forEach((row) => {
      const dateKey = row.date.split('T')[0];
      if (!aggregated[dateKey]) {
        aggregated[dateKey] = { date: dateKey };
      }
      aggregated[dateKey][row.vendorName] = row.landedUnitCost;
      vendors.add(row.vendorName);
    });

    const sortedData = Object.values(aggregated).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      series: sortedData.map(d => ({ ...d, formattedDate: formatDate(d.date) })),
      vendors: Array.from(vendors),
    };
  }, [data]);

  const colors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] selection:bg-indigo-500/30">
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link
            href="/items"
            className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Items
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-4">
                <TrendingUp className="w-4 h-4" />
                <span>Price History & Trends</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
                {item ? item.name : 'Loading Item...'}
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400 max-w-2xl">
                Compare landed costs from various vendors over time.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                disabled={isLoading || !itemId}
                className="flex items-center justify-center h-10 px-4 rounded-xl font-medium text-sm transition-all bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-6 border border-red-200 dark:border-red-900/50 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mb-3" />
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
              Failed to load pricing data
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : isLoading && data.length === 0 ? (
          <div className="h-[400px] bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
        ) : data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center">
            <TrendingUp className="mx-auto h-8 w-8 text-zinc-400 mb-3 opacity-50" />
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-1">
              No historical pricing data
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              This item has not been received from any vendors yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Unit Cost Over Time</h2>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.series} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                    <XAxis 
                      dataKey="formattedDate" 
                      stroke="#a1a1aa" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#a1a1aa" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => `$${val}`}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Cost']}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    {chartData.vendors.map((vendor, index) => (
                      <Line
                        key={vendor}
                        type="monotone"
                        dataKey={vendor}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Receipt History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-3 font-medium">Date Received</th>
                      <th className="px-6 py-3 font-medium">Vendor</th>
                      <th className="px-6 py-3 font-medium">PO Reference</th>
                      <th className="px-6 py-3 font-medium text-right">Landed Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {[...data].reverse().map((row, i) => (
                      <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-900 dark:text-zinc-300">
                          {formatDate(row.date)}
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                          {row.vendorName}
                        </td>
                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 font-mono text-xs">
                          {row.poId ? row.poId.split('-')[0] : 'Manual'}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-indigo-600 dark:text-indigo-400 tabular-nums">
                          {formatCurrency(row.landedUnitCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
