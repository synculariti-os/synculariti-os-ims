'use client';

import React from 'react';
import Link from 'next/link';
import { BarChart3, BellRing, PieChart, ArrowRight, Calculator, TrendingUp } from 'lucide-react';

export default function ReportsDashboard() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] bg-[url('/grid.svg')] dark:bg-[url('/grid-dark.svg')] bg-center selection:bg-indigo-500/30">
      <main className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-6">
                <PieChart className="w-4 h-4" />
                <span>Analytics & Reports</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight mb-4">
                Reporting Dashboard
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
                Gain insights into your inventory operations, track unexplained variances, and manage items falling below par.
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Variance Card */}
            <Link href="/reports/variance" className="group flex flex-col bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Variance Analytics</h3>
              <p className="text-zinc-600 dark:text-zinc-400 flex-grow mb-8">
                Compare theoretical vs actual inventory usage. Identify unexplained variances, theft, or over-portioning across your items.
              </p>
              <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium group-hover:gap-2 transition-all">
                View Report
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>

            {/* Par Alerts Card */}
            <Link href="/reports/par-alerts" className="group flex flex-col bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <BellRing className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Par Level Alerts</h3>
              <p className="text-zinc-600 dark:text-zinc-400 flex-grow mb-8">
                Monitor items that have fallen below their defined par levels. Optimize your procurement workflows and avoid stockouts.
              </p>
              <div className="flex items-center text-amber-600 dark:text-amber-400 font-medium group-hover:gap-2 transition-all">
                View Alerts
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* COGS Card */}
            <Link href="/reports/cogs" className="group flex flex-col bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Calculator className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Menu Item Costing (COGS)</h3>
              <p className="text-zinc-600 dark:text-zinc-400 flex-grow mb-8">
                Analyze theoretical costs for menu items based on actual landed costs of ingredients. Track profitability and target cost percentages.
              </p>
              <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium group-hover:gap-2 transition-all">
                View Costing Report
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>

            {/* Vendor Pricing Card */}
            <Link href="/reports/vendor-pricing" className="group flex flex-col bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Vendor Price History</h3>
              <p className="text-zinc-600 dark:text-zinc-400 flex-grow mb-8">
                Compare landed costs from various vendors over time to identify pricing trends and optimize your purchasing decisions.
              </p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:gap-2 transition-all">
                View Price Trends
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
