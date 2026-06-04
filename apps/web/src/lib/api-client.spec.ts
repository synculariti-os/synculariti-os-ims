import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from './api-client';

// Mock supabase
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

// Mock Zustand store
vi.mock('../store/use-auth-store', () => ({
  useAuthStore: {
    getState: vi.fn().mockReturnValue({ restaurantId: null }),
  },
}));

describe('apiClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('makes a basic GET request', async () => {
    const mockResponse = { data: 'test' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await apiClient('/test');
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        headers: expect.any(Headers),
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('throws an error on non-ok responses', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'Validation Failed' }),
    });

    await expect(apiClient('/test')).rejects.toThrow('Validation Failed');
  });
});
