import { apiClient } from '../api-client';
import { PurchaseOrder, Vendor } from '@ims/types';
import { CreatePoDto, CreateVendorDto } from '@ims/validators';

export const procurementApi = {
  createDraftPO: async (dto: CreatePoDto) => {
    return apiClient<PurchaseOrder>('/procurement/orders', { method: 'POST', body: dto });
  },
  submitPO: async (id: string) => {
    return apiClient<PurchaseOrder>(`/procurement/orders/${id}/submit`, { method: 'PATCH' });
  },
  cancelPO: async (id: string) => {
    return apiClient<void>(`/procurement/orders/${id}/cancel`, { method: 'PATCH' });
  },
  listVendors: async () => {
    return apiClient<{ data: Vendor[] }>('/procurement/vendors');
  },
  createVendor: async (dto: CreateVendorDto) => {
    return apiClient<Vendor>('/procurement/vendors', { method: 'POST', body: dto });
  },
  updateVendor: async (id: string, dto: any) => {
    return apiClient<Vendor>(`/procurement/vendors/${id}`, { method: 'PUT', body: dto });
  }
};
