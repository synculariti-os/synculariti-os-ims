'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/use-auth-store';
import { useSidebarStore } from '@/store/use-sidebar-store';
import { useHasHydrated } from '@/hooks/use-has-hydrated';
import type { PermissionCode } from '@ims/types';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Menu,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  permission: PermissionCode;
}

const items: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', permission: 'REPORTING.READ' as PermissionCode },
  { label: 'Inventory', icon: Package, href: '/inventory', permission: 'INVENTORY.READ' as PermissionCode },
  { label: 'Recipes', icon: Layers, href: '/recipes', permission: 'RECIPE.READ' as PermissionCode },
  { label: 'Procurement', icon: ShoppingCart, href: '/procurement/orders', permission: 'PROCUREMENT.READ' as PermissionCode },
];

export function MobileNav() {
  const pathname = usePathname();
  const isHydrated = useHasHydrated();
  const permissions = useAuthStore((state) => state.permissions);
  const { toggleMobile } = useSidebarStore();

  if (pathname === '/login') return null;
  if (!isHydrated) return <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 lg:hidden" />;

  const visible = items.filter((item) => permissions.includes(item.permission));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around px-2 lg:hidden">
      {visible.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-0',
              isActive
                ? 'text-blue-400'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-medium leading-tight truncate max-w-full">
              {item.label}
            </span>
          </Link>
        );
      })}
      <button
        onClick={toggleMobile}
        className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 shrink-0" />
        <span className="text-[10px] font-medium leading-tight">More</span>
      </button>
    </nav>
  );
}
