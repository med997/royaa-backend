import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { Product } from './product.entity.js';
import { CurrencyService } from '../currency/currency.service.js';
import { CategoriesService } from '../categories/categories.service.js';
import { BrandsService } from '../brands/brands.service.js';
import { FindProductsDto } from './dto/find-products.dto.js';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
    private readonly currency: CurrencyService,
    private readonly categories: CategoriesService,
    private readonly brands: BrandsService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    if ((await this.repo.count()) > 0) return;

    const categories = await this.categories.findAll();
    const brands = await this.brands.findAll();
    const category = (nameEn: string) => categories.find((c) => c.nameEn === nameEn)!;
    const brand = (name: string) => brands.find((b) => b.name === name)!;

    const seed = [
      {
        nameAr: 'إطار Arc One',
        nameEn: 'Arc One',
        basePriceMinorUnits: 4800,
        widthMm: 138,
        bridgeMm: 18,
        armMm: 145,
        rating: 4.8,
        ratingCount: 126,
        category: category('Classic'),
        brand: brand('Ray-Ban'),
        images: [{ url: 'https://picsum.photos/seed/arc-one/600/400', sortOrder: 0 }],
        variants: [
          { colorNameAr: 'أسود', colorNameEn: 'Black', colorHex: '#1c1c1c', stock: 20 },
          { colorNameAr: 'بني', colorNameEn: 'Tortoise', colorHex: '#7a5230', stock: 12 },
        ],
      },
      {
        nameAr: 'Terra Round',
        nameEn: 'Terra Round',
        basePriceMinorUnits: 5900,
        widthMm: 132,
        bridgeMm: 20,
        armMm: 140,
        rating: 4.6,
        ratingCount: 84,
        category: category('Round'),
        brand: brand('Persol'),
        images: [{ url: 'https://picsum.photos/seed/terra-round/600/400', sortOrder: 0 }],
        variants: [{ colorNameAr: 'تورتويز', colorNameEn: 'Tortoise', colorHex: '#8a6a3f', stock: 15 }],
      },
      {
        nameAr: 'Noir Sun',
        nameEn: 'Noir Sun',
        basePriceMinorUnits: 6200,
        widthMm: 140,
        bridgeMm: 19,
        armMm: 145,
        rating: 4.5,
        ratingCount: 63,
        category: category('Sunglasses'),
        brand: brand('Oakley'),
        images: [{ url: 'https://picsum.photos/seed/noir-sun/600/400', sortOrder: 0 }],
        variants: [{ colorNameAr: 'أسود', colorNameEn: 'Black', colorHex: '#101010', stock: 18 }],
      },
    ];

    for (const item of seed) {
      const product = this.repo.create(item);
      await this.repo.save(product);
    }
  }

  private async toDto(product: Product, currencyCode: string) {
    const price = await this.currency.convertFromBaseMinorUnits(product.basePriceMinorUnits, currencyCode);
    return {
      id: product.id,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      price,
      currency: currencyCode,
      widthMm: product.widthMm,
      bridgeMm: product.bridgeMm,
      armMm: product.armMm,
      rating: Number(product.rating),
      ratingCount: product.ratingCount,
      category: product.category ? { id: product.category.id, nameAr: product.category.nameAr, nameEn: product.category.nameEn } : null,
      brand: product.brand ? { id: product.brand.id, name: product.brand.name } : null,
      images: product.images?.sort((a, b) => a.sortOrder - b.sortOrder).map((i) => ({ id: i.id, url: i.url })) ?? [],
      variants: product.variants?.map((v) => ({ id: v.id, colorNameAr: v.colorNameAr, colorNameEn: v.colorNameEn, colorHex: v.colorHex, stock: v.stock })) ?? [],
    };
  }

  async findAll(filters: FindProductsDto) {
    const currencyCode = filters.currency ?? this.config.get<string>('DEFAULT_CURRENCY', 'YER');
    const where: Record<string, unknown> = { isActive: true };
    if (filters.categoryId) where.category = { id: filters.categoryId };
    if (filters.brandId) where.brand = { id: filters.brandId };
    if (filters.search) where.nameEn = ILike(`%${filters.search}%`);

    const products = await this.repo.find({ where });
    return Promise.all(products.map((p) => this.toDto(p, currencyCode)));
  }

  async findOne(id: string, currencyCode?: string) {
    const product = await this.repo.findOne({ where: { id, isActive: true } });
    if (!product) throw new NotFoundException('Product not found');
    return this.toDto(product, currencyCode ?? this.config.get<string>('DEFAULT_CURRENCY', 'YER'));
  }

  async findEntities(ids: string[]) {
    if (ids.length === 0) return [];
    return this.repo.findBy({ id: In(ids) });
  }

  toPublic(product: Product, currencyCode: string) {
    return this.toDto(product, currencyCode);
  }
}
