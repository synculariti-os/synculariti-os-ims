import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { SupabaseAuthGuard } from './common/guards/supabase-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';
import { TransformResponseInterceptor } from './common/interceptors/response.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { AppController } from './app.controller';
import { SalesModule } from './sales/sales.module';
import { ItemModule } from './item/item.module';
import { RecipeModule } from './recipe/recipe.module';
import { CoreModule } from './core/core.module';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { ProcurementModule } from './procurement/procurement.module';
import { InventoryModule } from './inventory/inventory.module';
import { ReportingModule } from './reporting/reporting.module';
import { AuditModule } from './audit/audit.module';

const redisUrl = process.env.REDIS_URL ? new URL(process.env.REDIS_URL) : null;

@Module({
  imports: [
    CoreModule,
    BullModule.forRoot({
      connection: redisUrl
        ? {
            host: redisUrl.hostname,
            port: parseInt(redisUrl.port, 10) || 6379,
            username: redisUrl.username || undefined,
            password: redisUrl.password || undefined,
            tls: redisUrl.protocol === 'rediss:' ? {} : undefined,
            maxRetriesPerRequest: null,
          }
        : {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            maxRetriesPerRequest: null,
          },
    }),
    AuthModule,
    TenantModule,
    ItemModule,
    ProcurementModule,
    RecipeModule,
    InventoryModule,
    SalesModule,
    ReportingModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}

