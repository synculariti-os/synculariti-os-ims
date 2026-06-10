'use client';

import React, { useEffect, useState } from 'react';
import { PermissionCode, PERMISSION_CODES } from '@ims/types';
import { apiClient } from '@/lib/api-client';
import { ShieldCheck, Search, Loader2 } from 'lucide-react';

const PERMISSION_GROUPS: Record<string, { label: string; codes: string[] }> = {
  'INVENTORY': {
    label: 'Inventory Management',
    codes: [PERMISSION_CODES.INVENTORY_READ, PERMISSION_CODES.INVENTORY_WRITE, PERMISSION_CODES.INVENTORY_COUNT],
  },
  'PROCUREMENT': {
    label: 'Procurement',
    codes: [PERMISSION_CODES.PROCUREMENT_READ, PERMISSION_CODES.PROCUREMENT_WRITE],
  },
  'RECIPE': {
    label: 'Recipes & BOM',
    codes: [PERMISSION_CODES.RECIPE_READ, PERMISSION_CODES.RECIPE_WRITE],
  },
  'SALES': {
    label: 'Sales',
    codes: [PERMISSION_CODES.SALES_IMPORT, PERMISSION_CODES.SALES_READ],
  },
  'REPORTING': {
    label: 'Reporting',
    codes: [PERMISSION_CODES.REPORTING_READ],
  },
  'ADMIN': {
    label: 'Administration',
    codes: [PERMISSION_CODES.ADMIN_USERS, PERMISSION_CODES.ADMIN_ROLES, PERMISSION_CODES.ADMIN_TENANTS],
  },
};

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  [PERMISSION_CODES.INVENTORY_READ]: 'View current stock levels, ledger entries, transfer history',
  [PERMISSION_CODES.INVENTORY_WRITE]: 'Record waste, transfers, and prep production logs',
  [PERMISSION_CODES.INVENTORY_COUNT]: 'Start, submit, and close physical inventory count batches',
  [PERMISSION_CODES.PROCUREMENT_READ]: 'View vendors, purchase orders, and receiving history',
  [PERMISSION_CODES.PROCUREMENT_WRITE]: 'Create, submit, receive, and cancel purchase orders',
  [PERMISSION_CODES.RECIPE_READ]: 'View recipes, BOMs, and POS menu item mappings',
  [PERMISSION_CODES.RECIPE_WRITE]: 'Create and edit recipes, ingredients, and mappings',
  [PERMISSION_CODES.SALES_IMPORT]: 'Upload and process POS XLSX/CSV sales files',
  [PERMISSION_CODES.SALES_READ]: 'View sales import history and processed rows',
  [PERMISSION_CODES.REPORTING_READ]: 'View variance analytics, EOD snapshots, and par level alerts',
  [PERMISSION_CODES.ADMIN_USERS]: 'Manage user-to-role and user-to-restaurant assignments',
  [PERMISSION_CODES.ADMIN_ROLES]: 'Create, edit, and delete roles and their permission sets',
  [PERMISSION_CODES.ADMIN_TENANTS]: 'Manage franchise groups and restaurants',
};

interface PermissionRow {
  id: string;
  code: string;
  description: string | null;
}

export function PermissionsTable() {
  const [dbPerms, setDbPerms] = useState<PermissionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient<{ data: PermissionRow[] }>('/admin/permissions');
        setDbPerms(data.data || []);
      } catch (err) {
        console.error('Failed to load permissions:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const dbPermMap = Object.fromEntries(dbPerms.map((p) => [p.code, p.id]));

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input type="text" placeholder="Search permissions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent" /></div>
      ) : (
        <div className="p-4 space-y-6">
          {Object.entries(PERMISSION_GROUPS).map(([key, group]) => {
            const visibleCodes = group.codes.filter((c) =>
              c.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (PERMISSION_DESCRIPTIONS[c] || '').toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (visibleCodes.length === 0) return null;

            return (
              <div key={key}>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3 uppercase tracking-wider">{group.label}</h3>
                <div className="grid gap-2">
                  {visibleCodes.map((code) => (
                    <div key={code} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                      <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-medium text-zinc-900 dark:text-white">{code}</span>
                          {dbPermMap[code] && <span className="text-xs text-zinc-400">ID: {dbPermMap[code].slice(0, 8)}...</span>}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{PERMISSION_DESCRIPTIONS[code] || code}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
