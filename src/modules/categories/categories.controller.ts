import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrors, ApiOk } from '../../common/swagger/api-response.js';
import { CategoryModel } from '../../common/swagger/response-models.js';

@ApiTags('الكتالوج')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة التصنيفات', description: 'مرتبة أبجدياً بالاسم الإنجليزي.' })
  @ApiOk(CategoryModel, 'التصنيفات', { isArray: true })
  findAll() {
    return this.service.findAll();
  }
}
