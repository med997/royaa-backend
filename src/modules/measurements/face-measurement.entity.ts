import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../users/user.entity.js';

@Entity('face_measurements')
export class FaceMeasurement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ name: 'pd_mm', type: 'double precision', nullable: true })
  pdMm: number | null;

  @Column({ name: 'face_width_mm', type: 'double precision', nullable: true })
  faceWidthMm: number | null;

  @Column({ name: 'face_shape', type: 'varchar', nullable: true })
  faceShape: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
