import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppConfigModule } from './modules/app-config/app-config.module.js';
import { CurrencyModule } from './modules/currency/currency.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { BrandsModule } from './modules/brands/brands.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { FavoritesModule } from './modules/favorites/favorites.module.js';
import { CartModule } from './modules/cart/cart.module.js';
import { AddressesModule } from './modules/addresses/addresses.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';
import { AppController } from './app.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const url = config.get<string>('DATABASE_URL');
        if (url) return { type: 'postgres', url, ssl: { rejectUnauthorized: false }, autoLoadEntities: true, synchronize: true };
        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST'),
          port: config.get<number>('DB_PORT'),
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASS'),
          database: config.get<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    CurrencyModule,
    AppConfigModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    BrandsModule,
    ProductsModule,
    FavoritesModule,
    CartModule,
    AddressesModule,
    OrdersModule,
    NotificationsModule,
    ReviewsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
