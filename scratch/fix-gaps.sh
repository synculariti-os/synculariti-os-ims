#!/bin/bash
set -e

echo "Fixing batches-table and unmapped-items-panel..."
# Wait, already fixed manually via replace_file_content above!

echo "Fixing procurementApi..."
cat << 'EOF' > apps/web/src/lib/api/procurement.ts
import { apiClient } from '../api-client';
import { PurchaseOrder, Vendor } from '@ims/types';
import { CreatePoDto, CreateVendorDto, UpdateVendorDto } from '@ims/validators';

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
  updateVendor: async (id: string, dto: UpdateVendorDto) => {
    return apiClient<Vendor>(`/procurement/vendors/${id}`, { method: 'PUT', body: dto });
  }
};
EOF

echo "Done generating API client."
