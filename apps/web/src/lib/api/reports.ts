import { apiClient } from '../api-client';
import { ParAlertRow } from '@ims/types';

export const reportsApi = {
  getParAlerts: async () => {
    return apiClient<{ data: ParAlertRow[] }>('/reports/par-alerts');
  },
};
