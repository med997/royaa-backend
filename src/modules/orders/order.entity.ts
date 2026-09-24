import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../users/user.entity.js';
import { OrderItem } from './order-item.entity.js';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ name: 'address_label' })
  addressLabel: string;

  @Column({ name: 'address_line1' })
  addressLine1: string;

  @Column({ name: 'address_city' })
  addressCity: string;

  @Column({ name: 'delivery_method' })
  deliveryMethod: string;

  @Column({ name: 'payment_method' })
  paymentMethod: string;

  @Column({ default: 'confirmed' })
  status: string;

  @Column()
  currency: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ name: 'delivery_fee', type: 'decimal', precision: 12, scale: 2 })
  deliveryFee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @OneToMany(() => OrderItem, (item) => item.order, { eager: true, cascade: true })
  items: Relation<OrderItem>[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
