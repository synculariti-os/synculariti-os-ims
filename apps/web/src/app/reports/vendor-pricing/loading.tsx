import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
          <div className="absolute inset-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
          </div>
        </div>
        <h2 className="mt-6 text-xl font-medium text-zinc-900 dark:text-white">
          Loading pricing data...
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Fetching historical vendor costs.
        </p>
      </div>
    </div>
  );
}
