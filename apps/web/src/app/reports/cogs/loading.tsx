import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8 space-y-4">
          <div className="h-6 w-24 bg-zinc-100 dark:bg-zinc-900 rounded animate-pulse" />
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="space-y-4">
              <div className="h-8 w-32 bg-zinc-100 dark:bg-zinc-900 rounded-full animate-pulse" />
              <div className="h-10 w-64 bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
              <div className="h-6 w-96 bg-zinc-100 dark:bg-zinc-900 rounded animate-pulse" />
            </div>
            <div className="h-10 w-24 bg-zinc-100 dark:bg-zinc-900 rounded-xl animate-pulse" />
          </div>
        </div>
        
        <div className="mb-6 h-10 w-full max-w-md bg-zinc-100 dark:bg-zinc-900 rounded-xl animate-pulse" />
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
