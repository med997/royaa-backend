import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CartItem } from './cart-item.entity.js';
import { AddCartItemDto } from './dto/cart.dto.js';
import { Prescription } from '../prescriptions/prescription.entity.js';
import { Product } from '../products/product.entity.js';
import { ProductVariant } from '../products/product-variant.entity.js';
import { CurrencyService } from '../currency/currency.service.js';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem) private readonly repo: Repository<CartItem>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Prescription) private readonly prescriptions: Repository<Prescription>,
    private readonly currency: CurrencyService,
    private readonly config: ConfigService,
  ) {}

  private assertStock(variant: ProductVariant | null, quantity: number) {
    if (variant && variant.stock < quantity) throw new BadRequestException(`Only ${variant.stock} in stock`);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const product = await this.products.findOne({ where: { id: dto.productId, isActive: true } });
    if (!product) throw new NotFoundException('Product not found');

    let variant: ProductVariant | null = null;
    if (dto.variantId) {
      variant = product.variants.find((v) => v.id === dto.variantId) ?? null;
      if (!variant) throw new NotFoundException('Variant not found');
    } else if (product.variants.length > 0) {
      throw new BadRequestException('Variant is required');
    }

    const prescription = dto.prescriptionId
      ? await this.prescriptions.findOne({ where: { id: dto.prescriptionId, user: { id: userId } } })
      : null;
    if (dto.prescriptionId && !prescription) throw new NotFoundException('Prescription not found');
    const lensType = dto.lensType ?? null;
    const quantity = dto.quantity ?? 1;

    const existing = await this.repo.findOne({
      where: {
        user: { id: userId },
        product: { id: product.id },
        variant: variant ? { id: variant.id } : IsNull(),
        prescription: prescription ? { id: prescription.id } : IsNull(),
        lensType: lensType ?? IsNull(),
      },
    });
    await this.assertStock(variant, (existing?.quantity ?? 0) + quantity);

    if (existing) {
      existing.quantity += quantity;
      await this.repo.save(existing);
    } else {
      await this.repo.save(this.repo.create({ user: { id: userId }, product, variant, prescription, lensType, quantity }));
    }

    return this.findAll(userId);
  }

  async updateQuantity(userId: string, itemId: string, quantity: number) {
    const item = await this.repo.findOne({ where: { id: itemId, user: { id: userId } } });
    if (!item) throw new NotFoundException('Cart item not found');
    await this.assertStock(item.variant, quantity);
    item.quantity = quantity;
    await this.repo.save(item);
    return this.findAll(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const item = await this.repo.findOne({ where: { id: itemId, user: { id: userId } } });
    if (!item) throw new NotFoundException('Cart item not found');
    await this.repo.remove(item);
    return this.findAll(userId);
  }

  async findEntities(userId: string) {
    const items = await this.repo.find({ where: { user: { id: userId } } });
    if (items.length === 0) throw new BadRequestException('Cart is empty');
    return items;
  }

  async clear(userId: string) {
    const items = await this.repo.find({ where: { user: { id: userId } } });
    await this.repo.remove(items);
  }

  async findAll(userId: string, currencyCode?: string) {
    const code = currencyCode ?? this.config.get<string>('DEFAULT_CURRENCY', 'YER');
    const items = await this.repo.find({ where: { user: { id: userId } }, order: { createdAt: 'ASC' } });

    let subtotal = 0;
    const dtoItems = [];
    for (const item of items) {
      const price = await this.currency.convertFromBaseMinorUnits(item.product.basePriceMinorUnits, code);
      const lineTotal = Math.round(price * item.quantity * 100) / 100;
      subtotal += lineTotal;
      dtoItems.push({
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          nameAr: item.product.nameAr,
          nameEn: item.product.nameEn,
          image: item.product.images?.[0]?.url ?? null,
          price,
        },
        variant: item.variant
          ? { id: item.variant.id, colorNameAr: item.variant.colorNameAr, colorNameEn: item.variant.colorNameEn, colorHex: item.variant.colorHex }
          : null,
        lensType: item.lensType,
        prescription: item.prescription ? { id: item.prescription.id, label: item.prescription.label } : null,
        inStock: !item.variant || item.variant.stock >= item.quantity,
        lineTotal,
      });
    }

    return { items: dtoItems, subtotal: Math.round(subtotal * 100) / 100, currency: code };
  }
}
