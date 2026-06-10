import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RestaurantId, FranchiseGroupId, PermissionCode } from '@ims/types';

interface AuthProfile {
  sub: string;
  email: string;
  restaurantId: RestaurantId;
  franchiseGroupId: FranchiseGroupId;
  permissions: PermissionCode[];
  fullName?: string;
}

interface AuthState {
  restaurantId: RestaurantId | null;
  restaurantName: string | null;
  franchiseGroupId: FranchiseGroupId | null;
  permissions: PermissionCode[];
  userEmail: string | null;
  userFullName: string | null;
  setContext: (restaurantId: RestaurantId, franchiseGroupId: FranchiseGroupId, restaurantName?: string) => void;
  clearContext: () => void;
  setProfile: (profile: Partial<AuthProfile>) => void;
  hasPermission: (code: PermissionCode) => boolean;
  hasAnyPermission: (codes: PermissionCode[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: null,
      franchiseGroupId: null,
      permissions: [],
      userEmail: null,
      userFullName: null,
      setContext: (restaurantId, franchiseGroupId, restaurantName) => set({ restaurantId, franchiseGroupId, restaurantName }),
      clearContext: () => set({ restaurantId: null, restaurantName: null, franchiseGroupId: null, permissions: [], userEmail: null, userFullName: null }),
      setProfile: (profile) => set((state) => ({
        ...(profile.sub ? { userEmail: profile.email, userFullName: profile.fullName ?? null } : {}),
        ...(profile.permissions ? { permissions: profile.permissions } : {}),
        ...(profile.restaurantId ? { restaurantId: profile.restaurantId, franchiseGroupId: profile.franchiseGroupId } : {}),
      ...(profile.restaurantId && (profile as any).restaurantName ? { restaurantName: (profile as any).restaurantName } : {}),
      })),
      hasPermission: (code) => get().permissions.includes(code),
      hasAnyPermission: (codes) => codes.some((code) => get().permissions.includes(code)),
    }),
    {
      name: 'ims-auth-context',
      partialize: (state) => ({
        restaurantId: state.restaurantId,
        restaurantName: state.restaurantName,
        franchiseGroupId: state.franchiseGroupId,
        permissions: state.permissions,
        userEmail: state.userEmail,
        userFullName: state.userFullName,
      }),
    }
  )
);

export async function loadAuthProfile() {
  try {
    const { apiClient } = await import('@/lib/api-client');
    const res = await apiClient<any>('/auth/me');
    const data = res.data ?? res;
    useAuthStore.getState().setProfile(data);
    return data;
  } catch {
    return null;
  }
}
