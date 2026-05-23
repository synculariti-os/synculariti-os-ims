import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'is_public';

/** Mark a route as publicly accessible (no auth required) */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
