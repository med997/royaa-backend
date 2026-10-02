import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsOrder, FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import { Product } from './product.entity.js';
import { CurrencyService } from '../currency/currency.service.js';
import { CategoriesService } from '../categories/categories.service.js';
import { BrandsService } from '../brands/brands.service.js';
import { FindProductsDto } from './dto/find-products.dto.js';
import { Paged, pageOpts } from '../../common/pagination.js';

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
        compareAtPriceMinorUnits: 6000,
        sku: 'ARC-001',
        shape: 'rectangle',
        material: 'acetate',
        gender: 'unisex',
        frameType: 'full-rim',
        isFeatured: true,
        isNew: true,
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
        sku: 'TRR-001',
        shape: 'round',
        material: 'metal',
        gender: 'women',
        frameType: 'full-rim',
        isBestSeller: true,
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
        sku: 'NRS-001',
        shape: 'aviator',
        material: 'metal',
        gender: 'men',
        frameType: 'full-rim',
        isBestSeller: true,
        isFeatured: true,
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
    const compareAt = product.compareAtPriceMinorUnits
      ? await this.currency.convertFromBaseMinorUnits(product.compareAtPriceMinorUnits, currencyCode)
      : null;
    return {
      id: product.id,
      sku: product.sku,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      price,
      compareAtPrice: compareAt,
      discountPercent: compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0,
      currency: currencyCode,
      widthMm: product.widthMm,
      bridgeMm: product.bridgeMm,
      armMm: product.armMm,
      shape: product.shape,
      material: product.material,
      gender: product.gender,
      frameType: product.frameType,
      model3dUrl: product.model3dUrl,
      modelUsdzUrl: product.modelUsdzUrl,
      modelPosterUrl: product.modelPosterUrl,
      view360Images: product.view360Images ?? [],
      isFeatured: product.isFeatured,
      isNew: product.isNew,
      isBestSeller: product.isBestSeller,
      rating: Number(product.rating),
      ratingCount: product.ratingCount,
      createdAt: product.createdAt,
      category: product.category
        ? { id: product.category.id, nameAr: product.category.nameAr, nameEn: product.category.nameEn, imageUrl: product.category.imageUrl }
        : null,
      brand: product.brand ? { id: product.brand.id, name: product.brand.name, nameAr: product.brand.nameAr, logoUrl: product.brand.logoUrl } : null,
      images: [...(product.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder).map((i) => ({ id: i.id, url: i.url })),
      variants:
        product.variants?.map((v) => ({ id: v.id, sku: v.sku, colorNameAr: v.colorNameAr, colorNameEn: v.colorNameEn, colorHex: v.colorHex, imageUrl: v.imageUrl, model3dUrl: v.model3dUrl, modelUsdzUrl: v.modelUsdzUrl, stock: v.stock })) ?? [],
    };
  }

  async findAll(filters: FindProductsDto) {
    const currencyCode = filters.currency ?? this.config.get<string>('DEFAULT_CURRENCY', 'YER');
    const base: FindOptionsWhere<Product> = { isActive: true };
    if (filters.categoryId) base.category = { id: filters.categoryId };
    if (filters.brandId) base.brand = { id: filters.brandId };
    for (const key of ['gender', 'shape', 'material', 'isFeatured', 'isNew', 'isBestSeller'] as const) {
      if (filters[key] !== undefined) Object.assign(base, { [key]: filters[key] });
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const min = filters.minPrice !== undefined ? await this.currency.toBaseMinorUnits(filters.minPrice, currencyCode) : 0;
      const max = filters.maxPrice !== undefined ? await this.currency.toBaseMinorUnits(filters.maxPrice, currencyCode) : 2147483647;
      base.basePriceMinorUnits = Between(min, max);
    }

    const where: FindOptionsWhere<Product>[] = filters.search
      ? ['nameEn', 'nameAr', 'sku'].map((col) => ({ ...base, [col]: ILike(`%${filters.search}%`) }))
      : [base];

    const orders: Record<string, FindOptionsOrder<Product>> = {
      newest: { createdAt: 'DESC' },
      price_asc: { basePriceMinorUnits: 'ASC' },
      price_desc: { basePriceMinorUnits: 'DESC' },
      rating: { rating: 'DESC', ratingCount: 'DESC' },
      popular: { ratingCount: 'DESC' },
    };
    const [products, total] = await this.repo.findAndCount({ where, order: orders[filters.sort ?? 'newest'], ...pageOpts(filters) });
    return new Paged(await Promise.all(products.map((p) => this.toDto(p, currencyCode))), total);
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
