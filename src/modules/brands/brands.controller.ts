import { Controller, Get } from '@nestjs/common';
import { BrandsService } from './brands.service.js';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrors, ApiOk } from '../../common/swagger/api-response.js';
import { BrandModel } from '../../common/swagger/response-models.js';

@ApiTags('الكتالوج')
@Controller('brands')
export class BrandsController {
  constructor(private readonly service: BrandsService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة الماركات', description: 'مرتبة أبجدياً بالاسم.' })
  @ApiOk(BrandModel, 'الماركات', { isArray: true })
  findAll() {
    return this.service.findAll();
  }
}
