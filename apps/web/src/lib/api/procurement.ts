import { apiClient } from '../api-client';
import { PurchaseOrder, Vendor } from '@ims/types';
import { CreatePoDto } from '@ims/validators';

export const procurementApi = {
  createDraftPO: async (dto: CreatePoDto) => {
    return apiClient<PurchaseOrder>('/procurement/orders', {
      method: 'POST',
      body: dto,
    });
  },
  listVendors: async () => {
    return apiClient<{ data: Vendor[] }>('/procurement/orders/vendors');
  },
};
