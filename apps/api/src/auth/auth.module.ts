import { Module, Global } from '@nestjs/common';
import { AuthService, USER_REPOSITORY_TOKEN, PERMISSION_REPOSITORY_TOKEN } from './auth.service';
import { AUTH_SERVICE_TOKEN } from './interfaces/i-auth.service';
import { AUTH_ADMIN_SERVICE_TOKEN } from './interfaces/i-auth-admin.service';
import { AuthAdminService } from './auth-admin.service';
import { UserRepository } from './user.repository';
import { PermissionRepository } from './permission.repository';
import { AuthController } from './auth.controller';
import { AuthAdminController } from './auth-admin.controller';
import { TenantModule } from '../tenant/tenant.module';

@Global()
@Module({
  imports: [TenantModule],
  controllers: [AuthController, AuthAdminController],
  providers: [
    {
      provide: AUTH_SERVICE_TOKEN,
      useClass: AuthService,
    },
    {
      provide: AUTH_ADMIN_SERVICE_TOKEN,
      useClass: AuthAdminService,
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
  exports: [AUTH_SERVICE_TOKEN, AUTH_ADMIN_SERVICE_TOKEN],
})
export class AuthModule {}
