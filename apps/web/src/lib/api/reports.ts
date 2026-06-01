import { apiClient } from '../api-client';
import { ParAlertRow, VendorPriceHistoryRow } from '@ims/types';

export const reportsApi = {
  getParAlerts: async () => {
    return apiClient<{ data: ParAlertRow[] }>('/reports/par-alerts');
  },
  getVendorPriceHistory: async (itemId: string) => {
    return apiClient<{ data: VendorPriceHistoryRow[] }>(`/reports/vendor-pricing?itemId=${itemId}`);
  },
};
