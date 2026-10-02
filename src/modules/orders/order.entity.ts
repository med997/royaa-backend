import { Column, CreateDateColumn, Entity, Generated, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../users/user.entity.js';
import { OrderItem } from './order-item.entity.js';
import { OrderStatusLog } from './order-status-log.entity.js';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_seq', type: 'int' })
  @Generated('increment')
  orderSeq: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ name: 'address_label' })
  addressLabel: string;

  @Column({ name: 'address_line1' })
  addressLine1: string;

  @Column({ name: 'address_city' })
  addressCity: string;

  @Column({ name: 'address_recipient_name', type: 'varchar', nullable: true })
  addressRecipientName: string | null;

  @Column({ name: 'address_recipient_phone', type: 'varchar', nullable: true })
  addressRecipientPhone: string | null;

  @Column({ name: 'address_district', type: 'varchar', nullable: true })
  addressDistrict: string | null;

  @Column({ name: 'address_notes', type: 'text', nullable: true })
  addressNotes: string | null;

  @Column({ name: 'address_latitude', type: 'double precision', nullable: true })
  addressLatitude: number | null;

  @Column({ name: 'address_longitude', type: 'double precision', nullable: true })
  addressLongitude: number | null;

  @Column({ name: 'delivery_method' })
  deliveryMethod: string;

  @Column({ name: 'payment_method' })
  paymentMethod: string;

  @Column({ default: 'confirmed' })
  status: string;

  @Column({ name: 'payment_status', default: 'pending' })
  paymentStatus: string;

  @Column({ name: 'coupon_code', type: 'varchar', nullable: true })
  couponCode: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

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

  @OneToMany(() => OrderStatusLog, (log) => log.order, { eager: true, cascade: true })
  statusLogs: Relation<OrderStatusLog>[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
