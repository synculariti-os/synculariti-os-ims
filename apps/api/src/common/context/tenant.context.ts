import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextData {
  franchiseId: string;
  restaurantId: string;
}

export const tenantContext = new AsyncLocalStorage<TenantContextData>();
