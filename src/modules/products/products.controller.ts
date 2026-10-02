import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { FindProductsDto } from './dto/find-products.dto.js';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiErrors, ApiOk } from '../../common/swagger/api-response.js';
import { ProductModel } from '../../common/swagger/response-models.js';

@ApiTags('الكتالوج')
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة المنتجات', description: 'يدعم التصفية بالتصنيف والماركة والبحث، وتُحوَّل الأسعار للعملة المطلوبة.' })
  @ApiOk(ProductModel, 'المنتجات', { isArray: true })
  findAll(@Query() query: FindProductsDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل منتج' })
  @ApiParam({ name: 'id', description: 'معرّف المنتج' })
  @ApiQuery({ name: 'currency', required: false, enum: ['YER', 'SAR', 'USD'], description: 'عملة الأسعار (الافتراضي YER)' })
  @ApiOk(ProductModel, 'تفاصيل المنتج')
  @ApiErrors([404, 'المنتج غير موجود'])
  findOne(@Param('id') id: string, @Query('currency') currency?: string) {
    return this.service.findOne(id, currency);
  }
}
