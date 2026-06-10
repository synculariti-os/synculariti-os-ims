'use client';

import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

export type FlagKey = 'MULTI_LANGUAGE';

interface FeatureFlag {
  id: string;
  flagKey: FlagKey;
  flagValue: boolean;
}

interface FeatureFlagsState {
  flags: Record<FlagKey, boolean>;
  loaded: boolean;
  loading: boolean;
  loadFlags: () => Promise<void>;
  isEnabled: (key: FlagKey) => boolean;
}

export const useFeatureFlagsStore = create<FeatureFlagsState>((set, get) => ({
  flags: {} as Record<FlagKey, boolean>,
  loaded: false,
  loading: false,

  loadFlags: async () => {
    set({ loading: true });
    try {
      const res = await apiClient<{ data: FeatureFlag[] }>('/settings/feature-flags');
      const flags = {} as Record<FlagKey, boolean>;
      for (const f of res.data || []) {
        if (f.flagKey === 'MULTI_LANGUAGE') {
          flags[f.flagKey] = f.flagValue;
        }
      }
      set({ flags, loaded: true });
    } catch {
      set({ loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  isEnabled: (key: FlagKey) => {
    const state = get();
    return state.flags[key] ?? false;
  },
}));
