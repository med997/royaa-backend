import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { FavoritesService } from './favorites.service.js';

class AddFavoriteDto {
  @IsString()
  productId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly service: FavoritesService) {}

  @Get()
  findAll(@CurrentUser() user: { userId: string }, @Query('currency') currency?: string) {
    return this.service.findAll(user.userId, currency);
  }

  @Post()
  add(@CurrentUser() user: { userId: string }, @Body() dto: AddFavoriteDto) {
    return this.service.add(user.userId, dto.productId);
  }

  @Delete(':productId')
  remove(@CurrentUser() user: { userId: string }, @Param('productId') productId: string) {
    return this.service.remove(user.userId, productId);
  }
}
