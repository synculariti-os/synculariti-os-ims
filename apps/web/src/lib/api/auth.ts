import { apiClient } from '../api-client';

export const authApi = {
  getMe: async () => apiClient<any>('/auth/me'),
  updateProfile: async (dto: any) => apiClient<any>('/auth/profile', { method: 'PATCH', body: dto }),
};
