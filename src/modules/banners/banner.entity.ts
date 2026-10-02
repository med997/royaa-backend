import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'title_ar' })
  titleAr: string;

  @Column({ name: 'title_en' })
  titleEn: string;

  @Column({ name: 'subtitle_ar', type: 'varchar', nullable: true })
  subtitleAr: string | null;

  @Column({ name: 'subtitle_en', type: 'varchar', nullable: true })
  subtitleEn: string | null;

  @Column({ name: 'image_url' })
  imageUrl: string;

  @Column({ name: 'link_type', type: 'varchar', nullable: true })
  linkType: string | null;

  @Column({ name: 'link_value', type: 'varchar', nullable: true })
  linkValue: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
