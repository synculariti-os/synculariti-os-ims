import { Controller, Get, Post, Inject } from '@nestjs/common';
import { AUTH_SERVICE_TOKEN, IAuthService } from './interfaces/i-auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload, UserId } from '@ims/types';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE_TOKEN) private readonly authService: IAuthService,
  ) {}

  @Get('me')
  async getMe(@CurrentUser() user: JwtPayload) {
    const profile = await this.authService.getProfile(user.sub);
    
    return {
      profile,
      permissions: user.permissions,
      restaurantId: user.restaurantId,
      franchiseGroupId: user.franchiseGroupId,
    };
  }

  @Post('select-restaurant')
  async selectRestaurant(@CurrentUser() user: JwtPayload) {
    // By the time it reaches here, SupabaseAuthGuard has already verified
    // that the user has access to the x-restaurant-id and enriched the user context
    // with the appropriate permissions.
    return user;
  }
}
