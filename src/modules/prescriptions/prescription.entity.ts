import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../users/user.entity.js';

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column()
  label: string;

  @Column({ name: 'right_sph', type: 'double precision', nullable: true })
  rightSph: number | null;

  @Column({ name: 'right_cyl', type: 'double precision', nullable: true })
  rightCyl: number | null;

  @Column({ name: 'right_axis', type: 'int', nullable: true })
  rightAxis: number | null;

  @Column({ name: 'left_sph', type: 'double precision', nullable: true })
  leftSph: number | null;

  @Column({ name: 'left_cyl', type: 'double precision', nullable: true })
  leftCyl: number | null;

  @Column({ name: 'left_axis', type: 'int', nullable: true })
  leftAxis: number | null;

  @Column({ name: 'add_power', type: 'double precision', nullable: true })
  addPower: number | null;

  @Column({ type: 'double precision', nullable: true })
  pd: number | null;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
