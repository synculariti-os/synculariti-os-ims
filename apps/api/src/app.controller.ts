import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getHello(): string {
    return 'Synculariti OS IMS API is running.';
  }

  @Public()
  @Get('health')
  getHealth(): string {
    return 'OK';
  }
}
