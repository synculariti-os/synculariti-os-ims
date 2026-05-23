import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type FetchOptions = Omit<RequestInit, 'body'> & {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

export async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = new Headers(options.headers);
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
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

  const fetchOptions = {
    ...options,
    headers,
  } as RequestInit;

  const response = await fetch(url, fetchOptions);

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

  return response.json();
}
