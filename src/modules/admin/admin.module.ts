import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Banner } from '../banners/banner.entity.js';
import { Brand } from '../brands/brand.entity.js';
import { Category } from '../categories/category.entity.js';
import { ContentPage, FaqItem } from '../content/content.entity.js';
import { Coupon } from '../coupons/coupon.entity.js';
import { Currency } from '../currency/currency.entity.js';
import { Notification } from '../notifications/notification.entity.js';
import { OrdersModule } from '../orders/orders.module.js';
import { ProductImage } from '../products/product-image.entity.js';
import { ProductVariant } from '../products/product-variant.entity.js';
import { Product } from '../products/product.entity.js';
import { ModelsModule } from '../models/models.module.js';
import { ReviewsModule } from '../reviews/reviews.module.js';
import { Store } from '../stores/store.entity.js';
import { SupportModule } from '../support/support.js';
import { User } from '../users/user.entity.js';
import { AdminProductsService } from './admin-products.service.js';
import {
  AdminAuthController, AdminDashboardController, AdminNotificationsController, AdminOrdersController, AdminProductsController,
  AdminReviewsController, AdminSupportController, AdminUsersController, AdminModelsController,
} from './admin.controllers.js';
import { AdminService } from './admin.service.js';
import {
  AdminBannersController, AdminBrandsController, AdminCategoriesController, AdminCouponsController, AdminCurrenciesController,
  AdminFaqsController, AdminPagesController, AdminStoresController,
} from './crud.controllers.js';
import { UploadsController, UploadsService } from './uploads.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Notification, Product, ProductImage, ProductVariant, Category, Brand, Banner, Coupon, FaqItem, ContentPage, Store, Currency]),
    AuthModule,
    OrdersModule,
    ReviewsModule,
    SupportModule,
    ModelsModule,
  ],
  controllers: [
    AdminAuthController, AdminDashboardController, AdminProductsController, AdminOrdersController, AdminUsersController, AdminReviewsController,
    AdminSupportController, AdminNotificationsController, UploadsController, AdminModelsController,
    AdminCategoriesController, AdminBrandsController, AdminBannersController, AdminCouponsController, AdminFaqsController, AdminPagesController,
    AdminStoresController, AdminCurrenciesController,
  ],
  providers: [AdminService, AdminProductsService, UploadsService],
})
export class AdminModule {}
