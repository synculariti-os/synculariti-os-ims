import { apiClient } from '../api-client';
import { MenuItemCostReport } from '@ims/types';

export const cogsApi = {
  getMenuCostingReport: async (): Promise<MenuItemCostReport[]> => {
    const res = await apiClient<{ data: MenuItemCostReport[] }>('/reports/cogs');
    return res.data;
  },
};
