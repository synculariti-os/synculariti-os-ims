import { apiClient } from '../api-client';

export const authApi = {
  getMe: async () => apiClient<unknown>('/auth/me'),
  updateProfile: async (dto: unknown) => apiClient<unknown>('/auth/profile', { method: 'PATCH', body: dto }),
};
