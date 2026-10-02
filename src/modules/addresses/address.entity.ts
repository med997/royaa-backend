import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../users/user.entity.js';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column()
  label: string;

  @Column()
  line1: string;

  @Column()
  city: string;

  @Column({ name: 'recipient_name', type: 'varchar', nullable: true })
  recipientName: string | null;

  @Column({ name: 'recipient_phone', type: 'varchar', nullable: true })
  recipientPhone: string | null;

  @Column({ type: 'varchar', nullable: true })
  district: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'double precision', nullable: true })
  latitude: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude: number | null;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;
}
