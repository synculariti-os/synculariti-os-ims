'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { cogsApi } from '@/lib/api/cogs';
import { MenuItemCostReport } from '@ims/types';
import {
  Calculator,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RefreshCw,
  Search,
} from 'lucide-react';
import Link from 'next/link';

export default function CogsReportPage() {
  const [data, setData] = useState<MenuItemCostReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const reports = await cogsApi.getMenuCostingReport();
      setData(reports);
    } catch (err: any) {
      setError(err.message || 'Failed to load COGS report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpand = (recipeId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(recipeId)) {
        next.delete(recipeId);
      } else {
        next.add(recipeId);
      }
      return next;
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(val);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      item.recipeName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] selection:bg-indigo-500/30">
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-8">
          <Link
            href="/reports"
            className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Reports
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-4">
                <Calculator className="w-4 h-4" />
                <span>Cost of Goods Sold</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
                Menu Item Costing
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400 max-w-2xl">
                Analyze theoretical costs for menu items based on actual landed costs of inventory batches.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                disabled={isLoading}
                className="flex items-center justify-center h-10 px-4 rounded-xl font-medium text-sm transition-all bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl leading-5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Content */}
        {error ? (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-6 border border-red-200 dark:border-red-900/50 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mb-3" />
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
              Failed to load COGS data
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : isLoading && data.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center">
            <Calculator className="mx-auto h-8 w-8 text-zinc-400 mb-3 opacity-50" />
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-1">
              No costing data available
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {searchQuery
                ? 'No menu items match your search query.'
                : 'There are no menu recipes with valid costing data to display.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredData.map((item) => {
              const isExpanded = expandedItems.has(item.recipeId as string);
              return (
                <div
                  key={item.recipeId as string}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-emerald-500/30"
                >
                  <div
                    className="px-6 py-4 flex items-center justify-between cursor-pointer select-none group"
                    onClick={() => toggleExpand(item.recipeId as string)}
                  >
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.recipeName}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {item.ingredients.length} Ingredients
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-0.5">
                          Total Cost
                        </div>
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.totalCost)}
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-100/50 dark:bg-zinc-800/50">
                            <tr>
                              <th className="px-6 py-3 font-medium">Ingredient</th>
                              <th className="px-6 py-3 font-medium text-right">Quantity</th>
                              <th className="px-6 py-3 font-medium text-right">Unit Cost</th>
                              <th className="px-6 py-3 font-medium text-right">Ext Cost</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {item.ingredients.map((ing) => (
                              <tr
                                key={ing.itemId as string}
                                className="hover:bg-white dark:hover:bg-zinc-800/50 transition-colors"
                              >
                                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-200">
                                  {ing.itemName}
                                </td>
                                <td className="px-6 py-4 text-right text-zinc-600 dark:text-zinc-400 tabular-nums">
                                  {ing.qty} {ing.uom}
                                </td>
                                <td className="px-6 py-4 text-right text-zinc-600 dark:text-zinc-400 tabular-nums">
                                  {formatCurrency(ing.unitCost)}
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-zinc-900 dark:text-white tabular-nums">
                                  {formatCurrency(ing.totalCost)}
                                </td>
                              </tr>
                            ))}
                            {item.ingredients.length === 0 && (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400"
                                >
                                  No ingredients found for this recipe.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
