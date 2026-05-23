import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { SalesModule } from './sales/sales.module';
import { CoreModule } from './core/core.module';
import { BullModule } from '@nestjs/bullmq';

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
          }
        : {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
          },
    }),
    SalesModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
