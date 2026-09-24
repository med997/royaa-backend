import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { CartService } from './cart.service.js';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly service: CartService) {}

  @Get()
  findAll(@CurrentUser() user: { userId: string }, @Query('currency') currency?: string) {
    return this.service.findAll(user.userId, currency);
  }

  @Post('items')
  addItem(@CurrentUser() user: { userId: string }, @Body() dto: AddCartItemDto) {
    return this.service.addItem(user.userId, dto.productId, dto.variantId, dto.quantity ?? 1);
  }

  @Patch('items/:id')
  updateItem(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: UpdateCartItemDto) {
    return this.service.updateQuantity(user.userId, id, dto.quantity);
  }

  @Delete('items/:id')
  removeItem(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.service.removeItem(user.userId, id);
  }
}
