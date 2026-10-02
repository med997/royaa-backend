import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { FavoritesService } from './favorites.service.js';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiErrors, ApiOk } from '../../common/swagger/api-response.js';
import { FavoriteResultModel, ProductModel } from '../../common/swagger/response-models.js';

class AddFavoriteDto {
  @ApiProperty({ description: 'معرّف المنتج', example: '3f1c2b7e-8a4d-4c1e-9b6a-2d5e7f8a9b0c' })
  @IsString()
  productId: string;
}

@ApiTags('المفضلة')
@ApiBearerAuth()
@ApiErrors([401, 'غير مصرّح: الرمز مفقود أو غير صالح'])
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly service: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة المفضلة', description: 'المنتجات المفضلة مرتبة من الأحدث.' })
  @ApiQuery({ name: 'currency', required: false, enum: ['YER', 'SAR', 'USD'], description: 'عملة الأسعار (الافتراضي YER)' })
  @ApiOk(ProductModel, 'المنتجات المفضلة', { isArray: true })
  findAll(@CurrentUser() user: { userId: string }, @Query('currency') currency?: string) {
    return this.service.findAll(user.userId, currency);
  }

  @Post()
  @ApiOperation({ summary: 'إضافة منتج للمفضلة', description: 'آمنة للتكرار: إن كان المنتج مضافاً يُرجع النتيجة نفسها.' })
  @ApiOk(FavoriteResultModel, 'تمت الإضافة', { status: 201 })
  add(@CurrentUser() user: { userId: string }, @Body() dto: AddFavoriteDto) {
    return this.service.add(user.userId, dto.productId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'إزالة منتج من المفضلة' })
  @ApiParam({ name: 'productId', description: 'معرّف المنتج' })
  @ApiOk(FavoriteResultModel, 'تمت الإزالة')
  @ApiErrors([404, 'المنتج ليس في المفضلة'])
  remove(@CurrentUser() user: { userId: string }, @Param('productId') productId: string) {
    return this.service.remove(user.userId, productId);
  }
}
