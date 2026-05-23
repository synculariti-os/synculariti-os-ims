import type { PermissionCode, JwtPayload, SafeUser, UserId, RestaurantId } from '@ims/types';
import type { UpdateProfileInput } from './i-user.repository';

export interface IAuthService {
  verifyAndEnrich(token: string, restaurantId: RestaurantId): Promise<JwtPayload>;
  resolvePermissions(userId: UserId, restaurantId: RestaurantId): Promise<PermissionCode[]>;
  getProfile(userId: UserId): Promise<SafeUser>;
  updateProfile(userId: UserId, dto: UpdateProfileInput): Promise<SafeUser>;
}

export const AUTH_SERVICE_TOKEN = Symbol('IAuthService');
