import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity.js';
import { OrderItem } from './order-item.entity.js';
import { OrderStatusLog } from './order-status-log.entity.js';
import { CouponsModule } from '../coupons/coupons.js';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { CartModule } from '../cart/cart.module.js';
import { AddressesModule } from '../addresses/addresses.module.js';
import { CurrencyModule } from '../currency/currency.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, OrderStatusLog]), CartModule, AddressesModule, CurrencyModule, AuthModule, NotificationsModule, CouponsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
