'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { PermissionCode } from '@ims/types';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { loadAuthProfile, useAuthStore } from '@/store/use-auth-store';
import { useFeatureFlagsStore } from '@/store/use-feature-flags-store';

const ROUTE_PERMISSIONS: Record<string, PermissionCode> = {
  '/dashboard': 'REPORTING.READ',
  '/items': 'INVENTORY.READ',
  '/items/categories': 'INVENTORY.READ',
  '/inventory': 'INVENTORY.READ',
  '/inventory/transfers': 'INVENTORY.WRITE',
  '/inventory/counts': 'INVENTORY.COUNT',
  '/inventory/waste': 'INVENTORY.WRITE',
  '/inventory/prep': 'INVENTORY.WRITE',
  '/inventory/ledger': 'INVENTORY.READ',
  '/procurement/vendors': 'PROCUREMENT.READ',
  '/procurement/orders': 'PROCUREMENT.READ',
  '/recipes': 'RECIPE.READ',
  '/recipes/mappings': 'RECIPE.READ',
  '/sales/import': 'SALES.IMPORT',
  '/reports/variance': 'REPORTING.READ',
  '/reports/snapshots': 'REPORTING.READ',
  '/reports/par-alerts': 'REPORTING.READ',
  '/admin/franchise-groups': 'ADMIN.TENANTS',
  '/admin/restaurants': 'ADMIN.TENANTS',
  '/admin/roles': 'ADMIN.ROLES',
  '/admin/permissions': 'ADMIN.ROLES',
  '/admin/assignments': 'ADMIN.USERS',
  '/admin/audit-logs': 'ADMIN.USERS',
  '/admin/feature-flags': 'ADMIN.FEATURE_FLAGS',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === '/login';
  const restaurantId = useAuthStore((state) => state.restaurantId);
  const permissions = useAuthStore((state) => state.permissions);
  const loadFlags = useFeatureFlagsStore((state) => state.loadFlags);
  const flagsLoaded = useFeatureFlagsStore((state) => state.loaded);

  useEffect(() => {
    if (restaurantId && permissions.length === 0) {
      loadAuthProfile();
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    if (permissions.length === 0) return;

    const sortedRoutes = Object.keys(ROUTE_PERMISSIONS).sort((a, b) => b.length - a.length);
    const matchedRoute = sortedRoutes.find((r) => pathname === r || pathname.startsWith(r + '/'));

    if (matchedRoute) {
      const requiredPerm = ROUTE_PERMISSIONS[matchedRoute];
      if (!permissions.includes(requiredPerm)) {
        router.replace('/dashboard');
      }
    }
  }, [pathname, permissions, restaurantId]);

  useEffect(() => {
    if (restaurantId && !flagsLoaded) {
      loadFlags();
    }
  }, [restaurantId, flagsLoaded]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <Navbar />
      <main className="min-h-screen pt-16 lg:pl-60 pb-16 lg:pb-0">
        {children}
      </main>
      <MobileNav />
    </>
  );
}
