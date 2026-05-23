import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { SalesModule } from './sales/sales.module';
import { CoreModule } from './core/core.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    CoreModule,
    BullModule.forRoot({
      connection: {
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
