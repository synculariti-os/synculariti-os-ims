import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AUTH_SERVICE_TOKEN } from '../../auth/interfaces/i-auth.service';
import type { IAuthService } from '../../auth/interfaces/i-auth.service';
import type { RestaurantId } from '@ims/types';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_TOKEN_ONLY_KEY } from '../decorators/token-only.decorator';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH_SERVICE_TOKEN) private readonly authService: IAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isTokenOnly = this.reflector.getAllAndOverride<boolean>(IS_TOKEN_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user: unknown }>();
    const headers = request.headers as unknown as Record<string, string>;

    const token = headers['authorization']?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    if (isTokenOnly) {
      const payload = await this.authService.verifyToken(token);
      request.user = payload;
      return true;
    }

    const restaurantId = headers['x-restaurant-id'] as RestaurantId;
    if (!restaurantId) {
      throw new UnauthorizedException('Missing x-restaurant-id header');
    }

    const payload = await this.authService.verifyAndEnrich(token, restaurantId);
    request.user = payload;

    return true;
  }
}
