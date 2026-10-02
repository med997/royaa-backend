import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { CartService } from './cart.service.js';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto.js';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiErrors, ApiOk } from '../../common/swagger/api-response.js';
import { CartModel } from '../../common/swagger/response-models.js';

@ApiTags('السلة')
@ApiBearerAuth()
@ApiErrors([401, 'غير مصرّح: الرمز مفقود أو غير صالح'])
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly service: CartService) {}

  @Get()
  @ApiOperation({ summary: 'عرض السلة', description: 'يُرجع العناصر والمجموع الفرعي بالعملة المطلوبة.' })
  @ApiQuery({ name: 'currency', required: false, enum: ['YER', 'SAR', 'USD'], description: 'عملة الأسعار (الافتراضي YER)' })
  @ApiOk(CartModel, 'محتوى السلة')
  findAll(@CurrentUser() user: { userId: string }, @Query('currency') currency?: string) {
    return this.service.findAll(user.userId, currency);
  }

  @Post('items')
  @ApiOperation({ summary: 'إضافة عنصر للسلة', description: 'إن وُجد العنصر نفسه (منتج + لون) تُزاد كميته. يُرجع السلة كاملة محدَّثة.' })
  @ApiOk(CartModel, 'السلة بعد الإضافة', { status: 201 })
  @ApiErrors([404, 'المنتج أو اللون غير موجود'])
  addItem(@CurrentUser() user: { userId: string }, @Body() dto: AddCartItemDto) {
    return this.service.addItem(user.userId, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'تعديل كمية عنصر', description: 'يُرجع السلة كاملة محدَّثة.' })
  @ApiParam({ name: 'id', description: 'معرّف عنصر السلة' })
  @ApiOk(CartModel, 'السلة بعد التعديل')
  @ApiErrors([404, 'عنصر السلة غير موجود'])
  updateItem(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: UpdateCartItemDto) {
    return this.service.updateQuantity(user.userId, id, dto.quantity);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'حذف عنصر من السلة', description: 'يُرجع السلة كاملة محدَّثة.' })
  @ApiParam({ name: 'id', description: 'معرّف عنصر السلة' })
  @ApiOk(CartModel, 'السلة بعد الحذف')
  @ApiErrors([404, 'عنصر السلة غير موجود'])
  removeItem(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.service.removeItem(user.userId, id);
  }
}
