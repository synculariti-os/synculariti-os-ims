export default function Home() {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Welcome to Synculariti OS IMS.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">Getting Started</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Use the navigation menu to access inventory, sales imports, and reporting modules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
