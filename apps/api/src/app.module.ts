import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [SalesModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
