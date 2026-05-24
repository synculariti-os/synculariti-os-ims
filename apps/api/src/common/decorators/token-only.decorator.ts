import { SetMetadata } from '@nestjs/common';

export const IS_TOKEN_ONLY_KEY = 'isTokenOnly';
export const TokenOnly = () => SetMetadata(IS_TOKEN_ONLY_KEY, true);
