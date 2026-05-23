import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AUTH_SERVICE_TOKEN } from './interfaces/i-auth.service';

import { UserRepository } from './user.repository';
import { PermissionRepository } from './permission.repository';
import { USER_REPOSITORY_TOKEN, PERMISSION_REPOSITORY_TOKEN } from './auth.service';

@Module({
  providers: [
    {
      provide: AUTH_SERVICE_TOKEN,
      useClass: AuthService,
    },
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: UserRepository,
    },
    {
      provide: PERMISSION_REPOSITORY_TOKEN,
      useClass: PermissionRepository,
    },
  ],
  exports: [AUTH_SERVICE_TOKEN],
})
export class AuthModule {}
