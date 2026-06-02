import { apiClient } from '../api-client';
import { ItemWithOverride, Category } from '@ims/types';

export const itemApi = {
  listItems: async () => apiClient<{ data: ItemWithOverride[] }>('/items'),
  createItem: async (dto: unknown) => apiClient<unknown>('/items', { method: 'POST', body: dto }),
  updateItem: async (id: string, dto: unknown) => apiClient<unknown>(`/items/${id}`, { method: 'PUT', body: dto }),
  deleteItem: async (id: string) => apiClient<unknown>(`/items/${id}`, { method: 'DELETE' }),
  listCategories: async () => apiClient<{ data: Category[] }>('/items/categories'),
  updateOverride: async (id: string, dto: unknown) => apiClient<unknown>(`/items/${id}/overrides`, { method: 'PATCH', body: dto }),
  upsertUomConversion: async (dto: unknown) => apiClient<unknown>('/items/uom-conversions', { method: 'POST', body: dto }),
};
