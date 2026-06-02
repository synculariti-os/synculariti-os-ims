import { apiClient } from '../api-client';

export const tenantApi = {
  listRestaurants: async () => apiClient<{ data: any[] }>('/tenant/restaurants'),
  createRestaurant: async (dto: any) => apiClient<any>('/tenant/restaurants', { method: 'POST', body: dto }),
  updateRestaurant: async (id: string, dto: any) => apiClient<any>(`/tenant/restaurants/${id}`, { method: 'PUT', body: dto }),
  listFranchises: async () => apiClient<{ data: any[] }>('/tenant/franchise-groups'),
};
