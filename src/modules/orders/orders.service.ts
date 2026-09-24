import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity.js';
import { CartService } from '../cart/cart.service.js';
import { AddressesService } from '../addresses/addresses.service.js';
import { CurrencyService } from '../currency/currency.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CheckoutDto } from './dto/checkout.dto.js';
import { computeTimeline } from './order-tracking.js';

const EXPRESS_FEE_BASE_MINOR_UNITS = 400;

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly repo: Repository<Order>,
    private readonly cart: CartService,
    private readonly addresses: AddressesService,
    private readonly currency: CurrencyService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const address = await this.addresses.findById(userId, dto.addressId);
    if (!address) throw new NotFoundException('Address not found');

    const cartItems = await this.cart.findEntities(userId);
    const currencyCode = dto.currency ?? this.config.get<string>('DEFAULT_CURRENCY', 'YER');

    const orderItems = [];
    let subtotal = 0;
    for (const item of cartItems) {
      const unitPrice = await this.currency.convertFromBaseMinorUnits(item.product.basePriceMinorUnits, currencyCode);
      const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
      subtotal += lineTotal;
      orderItems.push({
        nameAr: item.product.nameAr,
        nameEn: item.product.nameEn,
        colorNameAr: item.variant?.colorNameAr ?? null,
        colorNameEn: item.variant?.colorNameEn ?? null,
        productId: item.product.id,
        variantId: item.variant?.id ?? null,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
      });
    }

    const deliveryFee =
      dto.deliveryMethod === 'express' ? await this.currency.convertFromBaseMinorUnits(EXPRESS_FEE_BASE_MINOR_UNITS, currencyCode) : 0;
    const total = Math.round((subtotal + deliveryFee) * 100) / 100;

    const order = await this.repo.save(
      this.repo.create({
        user: { id: userId },
        addressLabel: address.label,
        addressLine1: address.line1,
        addressCity: address.city,
        deliveryMethod: dto.deliveryMethod,
        paymentMethod: dto.paymentMethod,
        currency: currencyCode,
        subtotal,
        deliveryFee,
        total,
        items: orderItems,
      }),
    );

    await this.cart.clear(userId);
    await this.notifications.create(
      userId,
      'order_confirmed',
      'Order confirmed',
      `Your order of ${orderItems.length} item(s) totalling ${total} ${currencyCode} has been confirmed.`,
    );
    return this.toDto(order);
  }

  async findAll(userId: string) {
    const orders = await this.repo.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' } });
    return orders.map((o) => ({
      id: o.id,
      status: computeTimeline(o.createdAt, o.deliveryMethod).currentStage,
      total: Number(o.total),
      currency: o.currency,
      itemCount: o.items.length,
      createdAt: o.createdAt,
    }));
  }

  async findOne(userId: string, id: string) {
    const order = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!order) throw new NotFoundException('Order not found');
    return this.toDto(order);
  }

  private toDto(order: Order) {
    const timeline = computeTimeline(order.createdAt, order.deliveryMethod);
    return {
      id: order.id,
      status: timeline.currentStage,
      timeline: timeline.stages,
      currency: order.currency,
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.total),
      address: { label: order.addressLabel, line1: order.addressLine1, city: order.addressCity },
      deliveryMethod: order.deliveryMethod,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      items: order.items.map((i) => ({
        nameAr: i.nameAr,
        nameEn: i.nameEn,
        colorNameAr: i.colorNameAr,
        colorNameEn: i.colorNameEn,
        productId: i.productId,
        variantId: i.variantId,
        unitPrice: Number(i.unitPrice),
        quantity: i.quantity,
        lineTotal: Number(i.lineTotal),
      })),
    };
  }
}
