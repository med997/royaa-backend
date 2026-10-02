import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Paged, PageQueryDto, pageOpts } from '../../common/pagination.js';
import { ProductImage } from '../products/product-image.entity.js';
import { ProductVariant } from '../products/product-variant.entity.js';
import { Product } from '../products/product.entity.js';
import { Category } from '../categories/category.entity.js';
import { Brand } from '../brands/brand.entity.js';
import { AdminProductDto } from './dto/catalog.dto.js';
import { ModelAsset } from '../models/model-asset.entity.js';
import { ModelsService } from '../models/models.service.js';

export class AdminProductsQuery extends PageQueryDto {
  search?: string;
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
}

const cents = (n: number | undefined) => (n === undefined ? undefined : Math.round(n * 100));

@Injectable()
export class AdminProductsService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
    @InjectRepository(ProductImage) private readonly images: Repository<ProductImage>,
    @InjectRepository(ProductVariant) private readonly variants: Repository<ProductVariant>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    @InjectRepository(Brand) private readonly brands: Repository<Brand>,
    private readonly models: ModelsService,
  ) {}

  private toDto(p: Product) {
    return {
      id: p.id,
      sku: p.sku,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      basePrice: p.basePriceMinorUnits / 100,
      compareAtPrice: p.compareAtPriceMinorUnits ? p.compareAtPriceMinorUnits / 100 : null,
      widthMm: p.widthMm,
      bridgeMm: p.bridgeMm,
      armMm: p.armMm,
      shape: p.shape,
      material: p.material,
      gender: p.gender,
      frameType: p.frameType,
      modelAssetId: p.modelAssetId,
      model3dUrl: p.model3dUrl,
      modelUsdzUrl: p.modelUsdzUrl,
      modelPosterUrl: p.modelPosterUrl,
      view360Images: p.view360Images ?? [],
      isFeatured: p.isFeatured,
      isNew: p.isNew,
      isBestSeller: p.isBestSeller,
      isActive: p.isActive,
      rating: Number(p.rating),
      ratingCount: p.ratingCount,
      createdAt: p.createdAt,
      category: p.category ? { id: p.category.id, nameAr: p.category.nameAr, nameEn: p.category.nameEn } : null,
      brand: p.brand ? { id: p.brand.id, name: p.brand.name } : null,
      images: [...p.images].sort((a, b) => a.sortOrder - b.sortOrder).map((i) => ({ id: i.id, url: i.url, sortOrder: i.sortOrder })),
      variants: p.variants.map((v) => ({ id: v.id, sku: v.sku, colorNameAr: v.colorNameAr, colorNameEn: v.colorNameEn, colorHex: v.colorHex, imageUrl: v.imageUrl, modelAssetId: v.modelAssetId, model3dUrl: v.model3dUrl, modelUsdzUrl: v.modelUsdzUrl, stock: v.stock })),
    };
  }

  async findAll(q: AdminProductsQuery) {
    const base = { ...(q.categoryId && { category: { id: q.categoryId } }), ...(q.brandId && { brand: { id: q.brandId } }), ...(q.isActive !== undefined && { isActive: q.isActive }) };
    const where = q.search ? ['nameEn', 'nameAr', 'sku'].map((c) => ({ ...base, [c]: ILike(`%${q.search}%`) })) : base;
    const [items, total] = await this.repo.findAndCount({ where, order: { createdAt: 'DESC' }, ...pageOpts(q) });
    return new Paged(items.map((p) => this.toDto(p)), total);
  }

  async findOne(id: string) {
    return this.toDto(await this.load(id));
  }

  private async load(id: string) {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async save(dto: Partial<AdminProductDto>, id?: string) {
    const { images, variants, basePrice, compareAtPrice, categoryId, brandId, modelAssetId, ...fields } = dto;
    const product = id ? await this.load(id) : this.repo.create({ images: [], variants: [] });
    const touched = [product.modelAssetId, ...product.variants.map((v) => v.modelAssetId)];

    if (categoryId !== undefined && !(product.category = await this.categories.findOneBy({ id: categoryId }))) throw new BadRequestException('Category not found');
    if (brandId !== undefined && !(product.brand = await this.brands.findOneBy({ id: brandId }))) throw new BadRequestException('Brand not found');
    Object.assign(product, fields);
    if (modelAssetId) await this.attach(product, modelAssetId);
    else if (modelAssetId !== undefined) {
      if (product.modelAssetId) Object.assign(product, { model3dUrl: fields.model3dUrl ?? null, modelUsdzUrl: fields.modelUsdzUrl ?? null });
      product.modelAssetId = null;
    }
    if (basePrice !== undefined) product.basePriceMinorUnits = cents(basePrice)!;
    if (compareAtPrice !== undefined) product.compareAtPriceMinorUnits = cents(compareAtPrice) ?? null;

    const saved = await this.repo.save(product);
    if (images) await this.sync(this.images, saved.images, images, saved, (i) => ({ url: i.url, sortOrder: i.sortOrder ?? 0 }));
    if (variants) {
      const ready = new Map<string, ModelAsset>();
      for (const v of variants) if (v.modelAssetId) ready.set(v.modelAssetId, await this.models.readyAsset(v.modelAssetId));
      await this.sync(this.variants, saved.variants, variants, saved, (v) => {
        const m = v.modelAssetId ? ready.get(v.modelAssetId)! : null;
        return {
          colorNameAr: v.colorNameAr, colorNameEn: v.colorNameEn, colorHex: v.colorHex, stock: v.stock, sku: v.sku ?? null, imageUrl: v.imageUrl ?? null,
          modelAssetId: m?.id ?? null, model3dUrl: m ? m.glbUrl : (v.model3dUrl ?? null), modelUsdzUrl: m ? m.usdzUrl : (v.modelUsdzUrl ?? null),
        };
      });
    }
    const after = await this.load(saved.id);
    await this.models.refreshUsage(...touched, after.modelAssetId, ...after.variants.map((v) => v.modelAssetId));
    return this.toDto(after);
  }

  private async sync<E extends { id: string }, D extends { id?: string }>(
    repo: Repository<E>,
    existing: E[],
    wanted: D[],
    product: Product,
    map: (d: D) => object,
  ) {
    const keep = new Set(wanted.map((w) => w.id).filter(Boolean));
    const drop = existing.filter((e) => !keep.has(e.id));
    if (drop.length) await repo.remove(drop);
    for (const w of wanted) {
      const current = w.id ? existing.find((e) => e.id === w.id) : undefined;
      if (w.id && !current) throw new BadRequestException(`Unknown id ${w.id}`);
      await repo.save(repo.create({ ...(current ?? {}), ...map(w), product } as never));
    }
  }

  private async attach(product: Product, id: string) {
    const m = await this.models.readyAsset(id);
    Object.assign(product, { modelAssetId: m.id, model3dUrl: m.glbUrl, modelUsdzUrl: m.usdzUrl });
  }

  async deactivate(id: string) {
    const product = await this.load(id);
    product.isActive = false;
    await this.repo.save(product);
  }

  async setStock(variantId: string, stock: number) {
    const variant = await this.variants.findOneBy({ id: variantId });
    if (!variant) throw new NotFoundException('Variant not found');
    variant.stock = stock;
    await this.variants.save(variant);
    return { id: variant.id, stock };
  }
}
