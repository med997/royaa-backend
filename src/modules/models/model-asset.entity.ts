import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('model_assets')
export class ModelAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'source_hash', unique: true })
  sourceHash: string;

  @Column()
  name: string;

  @Column({ default: 'processing' })
  status: 'processing' | 'ready' | 'failed';

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ name: 'public_base' })
  publicBase: string;

  @Column({ name: 'original_bytes', type: 'int' })
  originalBytes: number;

  @Column({ name: 'glb_bytes', type: 'int', nullable: true })
  glbBytes: number | null;

  @Column({ name: 'usdz_bytes', type: 'int', nullable: true })
  usdzBytes: number | null;

  @Column({ name: 'glb_url', type: 'varchar', nullable: true })
  glbUrl: string | null;

  @Column({ name: 'usdz_url', type: 'varchar', nullable: true })
  usdzUrl: string | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @Column({ name: 'unused_since', type: 'timestamptz', nullable: true })
  unusedSince: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
