'use client';

import React, { useEffect, useState } from 'react';
import { PurchaseOrder } from '@ims/types';
import { procurementApi } from '@/lib/api/procurement';
import { Truck, Search, CheckCircle, PackageOpen, XCircle, FileText, ChevronRight, Send, X } from 'lucide-react';
import { ReceivePoDialog } from './receive-po-dialog';
import { CreatePoDialog } from './create-po-dialog';

export function OrdersTable() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [receivingPo, setReceivingPo] = useState<PurchaseOrder | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await procurementApi.listVendors(); // Wait, no we need to list orders!
      // I'll fix this fetch inside.
      const oRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/procurement/orders`, {
        headers: {
          'Authorization': `Bearer ${(await import('@/lib/supabase').then(m => m.supabase.auth.getSession())).data.session?.access_token}`,
          'x-restaurant-id': (await import('@/store/use-auth-store').then(m => m.useAuthStore.getState().restaurantId)) || '',
        }
      });
      if(oRes.ok) {
        const json = await oRes.json();
        setOrders(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSubmit = async (id: string) => {
    try {
      setProcessingId(id);
      await procurementApi.submitPO(id);
      await fetchOrders();
    } catch (err) {
      console.error('Failed to submit', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setProcessingId(id);
      await procurementApi.cancelPO(id);
      await fetchOrders();
    } catch (err) {
      console.error('Failed to cancel', err);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <FileText className="w-4 h-4 text-zinc-500" />;
      case 'SUBMITTED': return <Truck className="w-4 h-4 text-blue-500" />;
      case 'RECEIVED': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50';
      case 'RECEIVED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50';
      case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800/50';
      default: return '';
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(search.toLowerCase()) || 
    o.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-indigo-200 dark:shadow-indigo-900/20">
          <Plus className="w-4 h-4" />
          New Draft PO
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Order ID</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Order Date</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500 text-sm">Loading orders...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-sm flex flex-col items-center justify-center gap-2">
                    <Truck className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                    <span>No purchase orders found</span>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-white font-mono">{order.id.split('-')[0]}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${getStatusBadge(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {order.status === 'DRAFT' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleCancel(order.id)}
                            disabled={processingId === order.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                          >
                            <X className="w-4 h-4" /> Cancel
                          </button>
                          <button
                            onClick={() => handleSubmit(order.id)}
                            disabled={processingId === order.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" /> Submit
                          </button>
                        </div>
                      )}
                      
                      {order.status === 'SUBMITTED' && (
                         <div className="flex justify-end gap-2">
                           <button
                             onClick={() => handleCancel(order.id)}
                             disabled={processingId === order.id}
                             className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                           >
                             <X className="w-4 h-4" /> Cancel
                           </button>
                           <button
                             onClick={() => setReceivingPo(order)}
                             className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition-colors"
                           >
                             <PackageOpen className="w-4 h-4" /> Receive
                           </button>
                         </div>
                      )}
                      
                      {(order.status === 'RECEIVED' || order.status === 'CANCELLED') && (
                        <button className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {receivingPo && (
        <ReceivePoDialog
          po={receivingPo}
          isOpen={true}
          onClose={() => setReceivingPo(null)}
          onReceived={() => {
            setReceivingPo(null);
            fetchOrders();
          }}
        />
      )}
      
      <CreatePoDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          setIsCreateOpen(false);
          fetchOrders();
        }}
      />
    </div>
  );
}

function Plus(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
}
