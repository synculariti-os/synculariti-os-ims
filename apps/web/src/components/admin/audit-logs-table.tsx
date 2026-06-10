'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { ClipboardList, Search, Loader2, Filter, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: any;
  newValue: any;
  success: boolean;
  errorMessage: string | null;
  sourceIp: string | null;
  createdAt: string;
}

type SortColumn = 'createdAt' | 'action' | 'entityType' | 'userEmail';
type SortDir = 'asc' | 'desc';

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'] as const;
const ENTITY_TYPES = ['users', 'roles', 'permissions', 'role_permissions', 'user_restaurant_roles', 'franchise_groups', 'restaurants', 'items', 'categories', 'vendors', 'purchase_orders', 'recipes', 'inventory_ledger'] as const;

export function AuditLogsTable() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [successFilter, setSuccessFilter] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = { page, limit: 50 };
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entityType = entityFilter;
      if (successFilter !== '') params.success = successFilter;

      const response = await apiClient<{ data: AuditLog[]; meta: { total: number; page: number; limit: number; totalPages: number } }>('/audit/logs', { params });
      setLogs(response.data || []);
      if (response.meta) setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, actionFilter, entityFilter, successFilter]);

  const toggleSort = (col: SortColumn) => {
    if (sortColumn === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(col); setSortDir('asc'); }
  };

  const sortIcon = (col: SortColumn) => {
    if (sortColumn !== col) return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-40" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 inline" /> : <ChevronDown className="w-3 h-3 ml-1 inline" />;
  };

  const sortedLogs = [...logs].sort((a, b) => {
    const aVal = (a[sortColumn] || '').toString();
    const bVal = (b[sortColumn] || '').toString();
    return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  const filteredLogs = sortedLogs.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (l.userEmail || '').toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.entityType.toLowerCase().includes(q) ||
      l.entityId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      {/* Filters */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input type="text" placeholder="Search by user, action, entity..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 text-xs text-zinc-500"><Filter className="w-3 h-3" /> Filters:</div>
          <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="px-2 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">All Actions</option>
            {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }} className="px-2 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">All Entities</option>
            {ENTITY_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={successFilter} onChange={(e) => { setSuccessFilter(e.target.value); setPage(1); }} className="px-2 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">All Results</option>
            <option value="true">Success Only</option>
            <option value="false">Failures Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium cursor-pointer select-none hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors" onClick={() => toggleSort('createdAt')}>Timestamp {sortIcon('createdAt')}</th>
              <th className="px-6 py-4 font-medium cursor-pointer select-none hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors" onClick={() => toggleSort('userEmail')}>User {sortIcon('userEmail')}</th>
              <th className="px-6 py-4 font-medium cursor-pointer select-none hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors" onClick={() => toggleSort('action')}>Action {sortIcon('action')}</th>
              <th className="px-6 py-4 font-medium cursor-pointer select-none hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors" onClick={() => toggleSort('entityType')}>Entity {sortIcon('entityType')}</th>
              <th className="px-6 py-4 font-medium">Entity ID</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center"><div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent" /></td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                <ClipboardList className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">No audit logs found</p>
                <p className="mt-1">Try adjusting your filters.</p>
              </td></tr>
            ) : (
              filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 text-zinc-500">{l.userEmail || l.userId?.slice(0, 8) || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      l.action === 'CREATE' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                      l.action === 'UPDATE' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                      l.action === 'DELETE' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                      'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}>{l.action}</span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{l.entityType}</td>
                  <td className="px-6 py-4 text-zinc-400 font-mono text-xs max-w-[120px] truncate">{l.entityId}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      l.success ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    }`}>
                      {l.success ? '✓' : '✗'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <p className="text-sm text-zinc-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors">Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
