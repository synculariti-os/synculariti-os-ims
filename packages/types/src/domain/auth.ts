import type { FranchiseGroupId, RestaurantId, UserId, RoleId } from '../branded';
import type { PermissionCode } from '../constants/permissions';
export interface User { id: UserId; email: string; fullName: string; passwordHash: string; phoneNumber: string | null; active: boolean; lastLoginAt: string | null; createdAt: string; updatedAt: string; }
export type SafeUser = Omit<User, 'passwordHash'>;
export interface Role { id: RoleId; name: string; description: string | null; createdAt: string; }
export interface JwtPayload { sub: UserId; email: string; restaurantId: RestaurantId; franchiseGroupId: FranchiseGroupId; permissions: PermissionCode[]; iat?: number; exp?: number; }
export interface TokenPair { accessToken: string; refreshToken: string; }
