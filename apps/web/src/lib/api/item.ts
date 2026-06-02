import { apiClient } from '../api-client';
import { ItemWithOverride, Category } from '@ims/types';

export const itemApi = {
  listItems: async () => apiClient<{ data: ItemWithOverride[] }>('/items'),
  createItem: async (dto: any) => apiClient<any>('/items', { method: 'POST', body: dto }),
  updateItem: async (id: string, dto: any) => apiClient<any>(`/items/${id}`, { method: 'PUT', body: dto }),
  deleteItem: async (id: string) => apiClient<any>(`/items/${id}`, { method: 'DELETE' }),
  listCategories: async () => apiClient<{ data: Category[] }>('/items/categories'),
  updateOverride: async (id: string, dto: any) => apiClient<any>(`/items/${id}/overrides`, { method: 'PATCH', body: dto }),
  upsertUomConversion: async (dto: any) => apiClient<any>('/items/uom-conversions', { method: 'POST', body: dto }),
};
