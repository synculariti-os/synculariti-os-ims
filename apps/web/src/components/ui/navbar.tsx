'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Layers, Link as LinkIcon, UploadCloud, Boxes } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Item Master', href: '/items', icon: Package },
    { name: 'Recipes & BOM', href: '/recipes', icon: Layers },
    { name: 'Sales Import', href: '/sales/import', icon: UploadCloud },
    { name: 'Inventory', href: '/inventory', icon: Boxes },
  ];

  return (
    <nav className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40 w-full backdrop-blur-xl bg-opacity-80 dark:bg-opacity-80">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center flex-shrink-0">
              <span className="text-lg font-bold text-blue-600 dark:text-blue-500 tracking-tight">Synculariti</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 ml-1">IMS</span>
            </div>
            
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href) && item.href !== '/recipes');
                // Special check for /recipes since /recipes/mappings is a child
                const isExactActive = pathname === item.href;
                const finalActive = item.href === '/recipes' ? isExactActive : isActive;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      finalActive
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 mr-2 ${finalActive ? 'text-blue-500' : 'opacity-70'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Mobile menu (simplified scrollable row) */}
        <div className="md:hidden flex overflow-x-auto py-3 space-x-1 border-t border-zinc-100 dark:border-zinc-800 scrollbar-hide">
          {navItems.map((item) => {
            const isExactActive = pathname === item.href;
            const finalActive = item.href === '/recipes' ? isExactActive : (pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href)));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`inline-flex flex-shrink-0 items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  finalActive
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
