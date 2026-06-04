import { apiClient } from '../api-client';
import type { StockLevel } from '@ims/types';

export interface LedgerEntry {
  id: string;
  restaurantId: string;
  itemId: string;
  itemName?: string;
  changeAmount: number;
  reasonCode: string;
  referenceId: string | null;
  createdAt: string;
}

export const inventoryApi = {
  getStock: async () => {
    return apiClient<{ data: StockLevel[] }>('/inventory/stock');
  },

  getLedger: async (limit = 50, offset = 0) => {
    return apiClient<{ data: LedgerEntry[]; meta: { limit: number; offset: number } }>(
      `/inventory/ledger?limit=${limit}&offset=${offset}`
    );
  },
};
