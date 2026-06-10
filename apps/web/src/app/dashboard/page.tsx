'use client';

import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Layers, UploadCloud, BarChart3, Shield, Store, ClipboardList, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/use-auth-store';
import type { PermissionCode } from '@ims/types';

interface Stat {
  label: string;
  value: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

const ALL_LINKS = [
  { label: 'Item Master', href: '/items', icon: ClipboardList, description: 'Manage items, categories, UOM conversions', permission: 'INVENTORY.READ' as PermissionCode },
  { label: 'Inventory', href: '/inventory', icon: Package, description: 'Stock levels, transfers, counts', permission: 'INVENTORY.READ' as PermissionCode },
  { label: 'Procurement', href: '/procurement/vendors', icon: ShoppingCart, description: 'Vendors and purchase orders', permission: 'PROCUREMENT.READ' as PermissionCode },
  { label: 'Recipes', href: '/recipes', icon: Layers, description: 'Bill of materials and POS mappings', permission: 'RECIPE.READ' as PermissionCode },
  { label: 'Sales Import', href: '/sales/import', icon: UploadCloud, description: 'Upload and process POS sales files', permission: 'SALES.IMPORT' as PermissionCode },
  { label: 'Reports', href: '/reports/variance', icon: BarChart3, description: 'Variance analysis and snapshots', permission: 'REPORTING.READ' as PermissionCode },
  { label: 'Admin', href: '/admin/franchise-groups', icon: Shield, description: 'Users, roles, tenancy settings', permission: 'ADMIN.TENANTS' as PermissionCode },
];

export default function DashboardPage() {
  const permissions = useAuthStore((state) => state.permissions);
  const hasPerm = (code: PermissionCode) => permissions.includes(code);

  const [stats, setStats] = useState<Stat[]>(() => {
    const initial: Stat[] = [
      { label: 'Items', value: '...', icon: ClipboardList, href: '/items', color: 'bg-emerald-500' },
      { label: 'Vendors', value: '...', icon: ShoppingCart, href: '/procurement/vendors', color: 'bg-violet-500' },
      { label: 'Recipes', value: '...', icon: Layers, href: '/recipes', color: 'bg-amber-500' },
    ];
    if (hasPerm('ADMIN.TENANTS')) {
      initial.unshift({ label: 'Restaurants', value: '...', icon: Store, href: '/admin/restaurants', color: 'bg-blue-500' });
    }
    return initial;
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [items, vendors, recipes] = await Promise.all([
          apiClient<{ data: any[] }>('/items').catch(() => null),
          apiClient<{ data: any[] }>('/procurement/vendors').catch(() => null),
          apiClient<{ data: any[] }>('/recipes').catch(() => null),
        ]);
        const updated: Stat[] = [
          { label: 'Items', value: String(items?.data?.length ?? '-'), icon: ClipboardList, href: '/items', color: 'bg-emerald-500' },
          { label: 'Vendors', value: String(vendors?.data?.length ?? '-'), icon: ShoppingCart, href: '/procurement/vendors', color: 'bg-violet-500' },
          { label: 'Recipes', value: String(recipes?.data?.length ?? '-'), icon: Layers, href: '/recipes', color: 'bg-amber-500' },
        ];
        if (hasPerm('ADMIN.TENANTS')) {
          const restaurants = await apiClient<{ data: any[] }>('/tenant/restaurants').catch(() => null);
          updated.unshift({ label: 'Restaurants', value: String(restaurants?.data?.length ?? '-'), icon: Store, href: '/admin/restaurants', color: 'bg-blue-500' });
        }
        setStats(updated);
      } catch {}
    }
    loadStats();
  }, []);

  const quickLinks = ALL_LINKS.filter((link) => hasPerm(link.permission));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <LayoutDashboard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Dashboard</h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-lg">Overview of your IMS system.</p>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <a
              key={stat.label}
              href={stat.href}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.color} bg-opacity-20`}>
                  <stat.icon className={`w-5 h-5 text-white`} />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 transition-colors" />
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{stat.label}</p>
            </a>
          ))}
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <link.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{link.label}</h3>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{link.description}</p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
