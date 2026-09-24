import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity.js';
import { ProductImage } from './product-image.entity.js';
import { ProductVariant } from './product-variant.entity.js';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { CurrencyModule } from '../currency/currency.module.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { BrandsModule } from '../brands/brands.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductImage, ProductVariant]), CurrencyModule, CategoriesModule, BrandsModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
