import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiOk } from './common/swagger/api-response.js';
import { HealthModel } from './common/swagger/response-models.js';

@ApiTags('النظام')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({ summary: 'فحص حالة الخدمة', description: 'يُستخدم للتأكد من أن الخادم يعمل.' })
  @ApiOk(HealthModel, 'الخدمة تعمل')
  health() {
    return { status: 'ok' };
  }
}
