import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { JwtPayload, SafeUser, UserId, RestaurantId, PermissionCode } from '@ims/types';
import type { IAuthService } from './interfaces/i-auth.service';
import type { IUserRepository, UpdateProfileInput } from './interfaces/i-user.repository';
import type { IPermissionRepository } from './interfaces/i-permission.repository';

export const SUPABASE_ADMIN_CLIENT = 'SUPABASE_ADMIN_CLIENT';
export const USER_REPOSITORY_TOKEN = Symbol('IUserRepository');
export const PERMISSION_REPOSITORY_TOKEN = Symbol('IPermissionRepository');

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(SUPABASE_ADMIN_CLIENT) private readonly supabase: SupabaseClient,
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepo: IUserRepository,
    @Inject(PERMISSION_REPOSITORY_TOKEN) private readonly permissionRepo: IPermissionRepository,
  ) {}

  async verifyToken(token: string): Promise<{ sub: UserId; email: string }> {
    const {
      data: { user: authUser },
      error,
    } = await this.supabase.auth.getUser(token);

    if (error ?? !authUser) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return {
      sub: authUser.id as UserId,
      email: authUser.email ?? '',
    };
  }

  async verifyAndEnrich(token: string, restaurantId: RestaurantId): Promise<JwtPayload> {
    // 1. Validate token with Supabase Auth
    const {
      data: { user: authUser },
      error,
    } = await this.supabase.auth.getUser(token);

    if (error ?? !authUser) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // 2. Load public profile
    const publicUser = await this.userRepo.findById(authUser.id as UserId);
    if (!publicUser) {
      throw new UnauthorizedException('User profile not found');
    }

    // 3. Check active status
    if (!publicUser.active) {
      throw new ForbiddenException('User account is deactivated');
    }

    // 4. Resolve franchise group
    const franchiseGroupId =
      await this.permissionRepo.getFranchiseGroupForRestaurant(restaurantId);

    // 5. Resolve permissions
    const permissions = await this.permissionRepo.resolvePermissions(
      authUser.id as UserId,
      restaurantId,
    );

    // 6. Update last login timestamp (fire-and-forget — don't block the request)
    void this.userRepo.updateLastLogin(authUser.id as UserId);

    return {
      sub: authUser.id as UserId,
      email: authUser.email ?? '',
      restaurantId,
      franchiseGroupId,
      permissions,
    };
  }

  async resolvePermissions(
    userId: UserId,
    restaurantId: RestaurantId,
  ): Promise<PermissionCode[]> {
    return this.permissionRepo.resolvePermissions(userId, restaurantId);
  }

  async getProfile(userId: UserId): Promise<SafeUser> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    return user;
  }

  async updateProfile(userId: UserId, dto: UpdateProfileInput): Promise<SafeUser> {
    return this.userRepo.updateProfile(userId, dto);
  }
}
