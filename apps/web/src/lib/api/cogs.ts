import { apiClient } from '../api-client';
import { MenuItemCostReport } from '@ims/types';

export const cogsApi = {
  getMenuCostingReport: async (): Promise<MenuItemCostReport[]> => {
    return apiClient<MenuItemCostReport[]>('/reports/cogs');
  },
};
