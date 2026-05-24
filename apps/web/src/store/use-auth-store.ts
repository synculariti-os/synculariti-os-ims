import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RestaurantId, FranchiseGroupId } from '@ims/types';

interface AuthState {
  restaurantId: RestaurantId | null;
  franchiseGroupId: FranchiseGroupId | null;
  setContext: (restaurantId: RestaurantId, franchiseGroupId: FranchiseGroupId) => void;
  clearContext: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      restaurantId: null,
      franchiseGroupId: null,
      setContext: (restaurantId, franchiseGroupId) => set({ restaurantId, franchiseGroupId }),
      clearContext: () => set({ restaurantId: null, franchiseGroupId: null }),
    }),
    {
      name: 'ims-auth-context',
    }
  )
);
