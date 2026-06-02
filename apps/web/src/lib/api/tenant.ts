import { apiClient } from '../api-client';

export const tenantApi = {
  listRestaurants: async () => apiClient<{ data: unknown[] }>('/tenant/restaurants'),
  createRestaurant: async (dto: unknown) => apiClient<unknown>('/tenant/restaurants', { method: 'POST', body: dto }),
  updateRestaurant: async (id: string, dto: unknown) => apiClient<unknown>(`/tenant/restaurants/${id}`, { method: 'PUT', body: dto }),
  listFranchises: async () => apiClient<{ data: unknown[] }>('/tenant/franchise-groups'),
};
