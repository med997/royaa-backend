import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductVariant } from '../products/product-variant.entity.js';
import { Product } from '../products/product.entity.js';
import { ModelAsset } from './model-asset.entity.js';
import { ModelsService } from './models.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ModelAsset, Product, ProductVariant])],
  providers: [ModelsService],
  exports: [ModelsService],
})
export class ModelsModule {}
