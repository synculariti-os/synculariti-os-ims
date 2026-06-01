import { Controller, Get, Post, Patch, Body, Inject } from '@nestjs/common';
import { AUTH_SERVICE_TOKEN, IAuthService } from './interfaces/i-auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TokenOnly } from '../common/decorators/token-only.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { updateProfileSchema, UpdateProfileDto } from '@ims/validators';
import type { JwtPayload } from '@ims/types';

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
  @TokenOnly()
  async selectRestaurant(@CurrentUser() user: JwtPayload) {
    // By the time it reaches here, SupabaseAuthGuard has already verified
    // that the user has access to the x-restaurant-id and enriched the user context
    // with the appropriate permissions.
    return user;
  }

  @Patch('profile')
  @TokenOnly()
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.sub, dto);
  }
}
