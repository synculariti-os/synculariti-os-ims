import { supabase } from './supabase';
import { useAuthStore } from '../store/use-auth-store';

// Fallback to the known Render production URL if deployed to Vercel/production, otherwise localhost
const isLocal = typeof window !== 'undefined' ? window.location.hostname === 'localhost' : process.env.NODE_ENV !== 'production';
const defaultApiUrl = isLocal ? 'http://localhost:3001' : 'https://ims-api-prod.onrender.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

type FetchOptions = Omit<RequestInit, 'body'> & {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  responseType?: 'json' | 'text' | 'blob';
};

export async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  let { data: { session } } = await supabase.auth.getSession();
  
  if (!session || !session.access_token) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const retry = await supabase.auth.getSession();
    session = retry.data.session;
  }
  const { restaurantId } = useAuthStore.getState();
  
  const headers = new Headers(options.headers);
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  if (restaurantId) {
    headers.set('x-restaurant-id', restaurantId);
  }
  
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.body) as string;
  }

  let url = `${API_URL}${endpoint}`;
  
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  const fetchOptions = {
    ...options,
    headers,
    signal: controller.signal,
  } as RequestInit;

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = response.statusText;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorData.error || errorMsg;
      } catch {
        // Ignore JSON parse errors
      }
      throw new Error(errorMsg);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    if (options.responseType === 'text') {
      return response.text() as unknown as T;
    }
    if (options.responseType === 'blob') {
      return response.blob() as unknown as T;
    }

    return response.json();
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
}
