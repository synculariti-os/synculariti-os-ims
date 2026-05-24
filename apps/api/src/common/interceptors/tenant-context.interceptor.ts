import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtPayload } from '@ims/types';
import { tenantContext } from '../context/tenant.context';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_TOKEN_ONLY_KEY } from '../decorators/token-only.decorator';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isTokenOnly = this.reflector.getAllAndOverride<boolean>(IS_TOKEN_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic || isTokenOnly) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload | undefined = request.user;

    if (!user || !user.restaurantId) {
      // In a real app, you might skip this for public routes or global admin routes.
      // But per rules, all operations require a valid restaurant context.
      throw new UnauthorizedException('Tenant context (restaurantId) is missing');
    }

    // Wrap the request in the tenant context so the DB driver can intercept it
    return new Observable(subscriber => {
      tenantContext.run(
        {
          franchiseId: user.franchiseGroupId,
          restaurantId: user.restaurantId,
        },
        () => {
          next.handle().subscribe({
            next: (value) => subscriber.next(value),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        }
      );
    });
  }
}
