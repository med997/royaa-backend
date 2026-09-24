import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Product } from './product.entity.js';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'color_name_ar' })
  colorNameAr: string;

  @Column({ name: 'color_name_en' })
  colorNameEn: string;

  @Column({ name: 'color_hex' })
  colorHex: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;
}
