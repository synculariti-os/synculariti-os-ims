'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/use-auth-store';
import { useSidebarStore } from '@/store/use-sidebar-store';
import { useHasHydrated } from '@/hooks/use-has-hydrated';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Layers,
  UploadCloud,
  BarChart3,
  Shield,
  ChevronDown,
  Store,
  ClipboardList,
  BadgeCheck,
  X,
} from 'lucide-react';

function deriveRole(permissions: string[]): string {
  if (permissions.includes('ADMIN.TENANTS')) return 'Administrator';
  if (permissions.includes('PROCUREMENT.WRITE') && permissions.includes('SALES.IMPORT')) return 'Restaurant Manager';
  if (permissions.includes('INVENTORY.COUNT')) return 'Inventory Operator';
  if (permissions.includes('PROCUREMENT.WRITE')) return 'Procurement Specialist';
  if (permissions.includes('ADMIN.USERS') && permissions.includes('REPORTING.READ')) return 'Accountant';
  if (permissions.includes('PROCUREMENT.READ')) return 'Franchise Manager';
  return 'Unknown';
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  'Administrator': 'text-red-400',
  'Restaurant Manager': 'text-blue-400',
  'Inventory Operator': 'text-emerald-400',
  'Procurement Specialist': 'text-amber-400',
  'Franchise Manager': 'text-purple-400',
  'Accountant': 'text-cyan-400',
};

interface Section {
  label: string;
  labelKey: string;
  icon: React.ElementType;
  href?: string;
  children?: { label: string; labelKey: string; href: string; permission?: string }[];
  permission?: string;
}

const sections: Section[] = [
  { label: 'Dashboard', labelKey: 'dashboard', icon: LayoutDashboard, href: '/dashboard', permission: 'REPORTING.READ' },
  {
    label: 'Item Master',
    labelKey: 'itemMaster',
    icon: ClipboardList,
    permission: 'INVENTORY.READ',
    children: [
      { label: 'Items', labelKey: 'items', href: '/items', permission: 'INVENTORY.READ' },
      { label: 'Categories', labelKey: 'categories', href: '/items/categories', permission: 'INVENTORY.READ' },
    ],
  },
  {
    label: 'Inventory',
    labelKey: 'inventory',
    icon: Package,
    permission: 'INVENTORY.READ',
    children: [
      { label: 'Stock Levels', labelKey: 'stockLevels', href: '/inventory', permission: 'INVENTORY.READ' },
      { label: 'Transfers', labelKey: 'transfers', href: '/inventory/transfers', permission: 'INVENTORY.WRITE' },
      { label: 'Counts', labelKey: 'counts', href: '/inventory/counts', permission: 'INVENTORY.COUNT' },
      { label: 'Waste', labelKey: 'waste', href: '/inventory/waste', permission: 'INVENTORY.WRITE' },
      { label: 'Prep Production', labelKey: 'prepProduction', href: '/inventory/prep', permission: 'INVENTORY.WRITE' },
      { label: 'Ledger', labelKey: 'ledger', href: '/inventory/ledger', permission: 'INVENTORY.READ' },
    ],
  },
  {
    label: 'Procurement',
    labelKey: 'procurement',
    icon: ShoppingCart,
    permission: 'PROCUREMENT.READ',
    children: [
      { label: 'Vendors', labelKey: 'vendors', href: '/procurement/vendors', permission: 'PROCUREMENT.READ' },
      { label: 'Purchase Orders', labelKey: 'purchaseOrders', href: '/procurement/orders', permission: 'PROCUREMENT.READ' },
    ],
  },
  {
    label: 'Recipes',
    labelKey: 'recipes',
    icon: Layers,
    permission: 'RECIPE.READ',
    children: [
      { label: 'Bill of Materials', labelKey: 'billOfMaterials', href: '/recipes', permission: 'RECIPE.READ' },
      { label: 'POS Mappings', labelKey: 'posMappings', href: '/recipes/mappings', permission: 'RECIPE.READ' },
    ],
  },
  {
    label: 'Sales',
    labelKey: 'sales',
    icon: UploadCloud,
    permission: 'SALES.IMPORT',
    children: [
      { label: 'Import POS', labelKey: 'importPos', href: '/sales/import', permission: 'SALES.IMPORT' },
    ],
  },
  {
    label: 'Reports',
    labelKey: 'reports',
    icon: BarChart3,
    permission: 'REPORTING.READ',
    children: [
      { label: 'Variance Analysis', labelKey: 'varianceAnalysis', href: '/reports/variance', permission: 'REPORTING.READ' },
      { label: 'Snapshots', labelKey: 'snapshots', href: '/reports/snapshots', permission: 'REPORTING.READ' },
      { label: 'Par Alerts', labelKey: 'parAlerts', href: '/reports/par-alerts', permission: 'REPORTING.READ' },
    ],
  },
  {
    label: 'Admin',
    labelKey: 'admin',
    icon: Shield,
    permission: 'ADMIN.TENANTS',
    children: [
      { label: 'Franchise Groups', labelKey: 'franchiseGroups', href: '/admin/franchise-groups', permission: 'ADMIN.TENANTS' },
      { label: 'Restaurants', labelKey: 'restaurants', href: '/admin/restaurants', permission: 'ADMIN.TENANTS' },
      { label: 'Roles', labelKey: 'roles', href: '/admin/roles', permission: 'ADMIN.ROLES' },
      { label: 'Permissions', labelKey: 'permissions', href: '/admin/permissions', permission: 'ADMIN.ROLES' },
      { label: 'User Assignments', labelKey: 'userAssignments', href: '/admin/assignments', permission: 'ADMIN.USERS' },
      { label: 'Audit Logs', labelKey: 'auditLogs', href: '/admin/audit-logs', permission: 'ADMIN.USERS' },
      { label: 'Feature Flags', labelKey: 'featureFlags', href: '/admin/feature-flags', permission: 'ADMIN.FEATURE_FLAGS' },
    ],
  },
];

function SidebarSection({ section, pathname }: { section: Section; pathname: string }) {
  const t = useTranslations('nav');
  const [expanded, setExpanded] = React.useState(() => {
    if (!section.children) return true;
    return section.children.some((c) => pathname.startsWith(c.href));
  });

  const iconColor = pathname.startsWith(section.children?.[0]?.href ?? section.href ?? '')
    ? 'text-blue-400'
    : 'text-zinc-400';

  if (section.href) {
    const isActive = pathname === section.href;
    return (
      <Link
        href={section.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-zinc-800 text-white'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
        )}
      >
        <section.icon className="w-5 h-5 shrink-0" />
        {t(section.labelKey)}
      </Link>
    );
  }

  if (section.children) {
    const isAnyChildActive = section.children.some((c) => pathname.startsWith(c.href));

    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            isAnyChildActive
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          )}
        >
          <div className="flex items-center gap-3">
            <section.icon className="w-5 h-5 shrink-0" />
            {t(section.labelKey)}
          </div>
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform',
              expanded ? 'rotate-0' : '-rotate-90'
            )}
          />
        </button>
        {expanded && (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-zinc-800 pl-3">
              {section.children.map((child) => {
                const isActive = pathname === child.href || pathname.startsWith(child.href + '/');
                return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    'block px-3 py-1.5 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  )}
                >
                  {t(child.labelKey)}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export function Sidebar() {
  const pathname = usePathname();
  const isHydrated = useHasHydrated();
  const { restaurantId, restaurantName, userEmail, userFullName, permissions } = useAuthStore();
  const { isMobileOpen, closeMobile } = useSidebarStore();

  const roleName = isHydrated ? deriveRole(permissions) : '';
  const perms = (isHydrated ? permissions : []) as string[];
  const visibleSections = sections.filter((section) => {
    if (section.children) {
      return section.children.some((child) => {
        if (!child.permission) return true;
        return perms.includes(child.permission);
      });
    }
    if (!section.permission) return true;
    return perms.includes(section.permission);
  }).map((section) => {
    if (!section.children) return section;
    return {
      ...section,
      children: section.children.filter((child) => {
        if (!child.permission) return true;
        return perms.includes(child.permission);
      }),
    };
  });

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    closeMobile();
  }, [pathname]);

  // Close sidebar on Escape key (mobile)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMobile();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isHydrated) {
    return (
      <aside className="fixed left-0 top-0 z-50 h-screen w-60 bg-zinc-950 border-r border-zinc-800 flex flex-col lg:translate-x-0" />
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen w-60 bg-zinc-950 border-r border-zinc-800 flex flex-col
          transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:z-30
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo + close button */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">S</span>
            </div>
            <span className="text-sm font-bold text-white tracking-tight">Synculariti</span>
          </div>
          <button
            onClick={closeMobile}
            className="lg:hidden p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleSections.map((section) => (
            <SidebarSection key={section.label} section={section} pathname={pathname} />
          ))}
        </nav>

        {/* Bottom: Restaurant + User info */}
        <div className="px-4 py-3 border-t border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <Store className="w-3.5 h-3.5" />
            <span className="truncate font-medium text-zinc-300">
              {restaurantId ? (restaurantName || `${restaurantId.slice(0, 8)}...`) : 'No restaurant'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-500 text-xs truncate mt-0.5">
            <BadgeCheck className={`w-3 h-3 shrink-0 ${ROLE_BADGE_COLORS[roleName] || 'text-zinc-500'}`} />
            <span className={ROLE_BADGE_COLORS[roleName] || 'text-zinc-500'}>{roleName}</span>
            <span className="text-zinc-600">·</span>
            <span>{userFullName || userEmail || 'Signed in'}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
