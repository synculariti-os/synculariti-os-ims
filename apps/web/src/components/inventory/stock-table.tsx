'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { cn } from '@/lib/utils';

interface StockLevel {
  itemId: string;
  itemName: string;
  baseUom: string;
  qty: number;
}

export function StockTable() {
  const [stock, setStock] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const { restaurantId } = useAuthStore();

  useEffect(() => {
    let isMounted = true;
    
    const fetchStock = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !restaurantId) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/inventory/stock`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'x-restaurant-id': restaurantId,
          },
        });

        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            setStock(json.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch stock', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStock();
    const intervalId = setInterval(fetchStock, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [restaurantId]);

  return (
    <div className="w-full mt-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Current Stock</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Real-time inventory levels</p>
        </div>
      </div>
      
      <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl overflow-hidden shadow-sm">
        {loading && stock.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 animate-pulse">
            Loading stock levels...
          </div>
        ) : stock.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-400">
              <Package className="w-8 h-8 opacity-50" />
            </div>
            <h4 className="text-zinc-900 dark:text-white font-medium mb-1">No stock available</h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Inventory levels are currently zero.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                  <th className="p-4 px-6 font-medium">Item Name</th>
                  <th className="p-4 px-6 font-medium text-right">Quantity</th>
                  <th className="p-4 px-6 font-medium">UOM</th>
                  <th className="p-4 px-6 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50 text-sm">
                {stock.map((item) => (
                  <tr key={item.itemId} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-4 px-6 text-zinc-900 dark:text-zinc-100 font-medium whitespace-nowrap">
                      {item.itemName}
                    </td>
                    <td className="p-4 px-6 text-right whitespace-nowrap">
                      <span className={cn(
                        "font-mono font-medium",
                        item.qty < 0 ? "text-red-600 dark:text-red-400" : "text-zinc-700 dark:text-zinc-300"
                      )}>
                        {item.qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="p-4 px-6 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {item.baseUom}
                    </td>
                    <td className="p-4 px-6 whitespace-nowrap">
                      {item.qty <= 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Out of Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                          In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
