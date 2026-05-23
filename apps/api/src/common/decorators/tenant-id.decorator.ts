import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '@ims/types';

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    return request.user?.restaurantId ?? null;
  },
);
