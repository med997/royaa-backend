import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Category } from '../categories/category.entity.js';
import { Brand } from '../brands/brand.entity.js';
import { ProductImage } from './product-image.entity.js';
import { ProductVariant } from './product-variant.entity.js';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name_ar' })
  nameAr: string;

  @Column({ name: 'name_en' })
  nameEn: string;

  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr: string | null;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn: string | null;

  @Column({ name: 'base_price_minor_units', type: 'int' })
  basePriceMinorUnits: number;

  @Column({ name: 'width_mm', type: 'int', nullable: true })
  widthMm: number | null;

  @Column({ name: 'bridge_mm', type: 'int', nullable: true })
  bridgeMm: number | null;

  @Column({ name: 'arm_mm', type: 'int', nullable: true })
  armMm: number | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ name: 'rating_count', type: 'int', default: 0 })
  ratingCount: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => Category, { eager: true, nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @ManyToOne(() => Brand, { eager: true, nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand | null;

  @OneToMany(() => ProductImage, (image) => image.product, { eager: true, cascade: true })
  images: Relation<ProductImage>[];

  @OneToMany(() => ProductVariant, (variant) => variant.product, { eager: true, cascade: true })
  variants: Relation<ProductVariant>[];
}
