import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('faq_items')
export class FaqItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'question_ar' })
  questionAr: string;

  @Column({ name: 'question_en' })
  questionEn: string;

  @Column({ name: 'answer_ar', type: 'text' })
  answerAr: string;

  @Column({ name: 'answer_en', type: 'text' })
  answerEn: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}

@Entity('content_pages')
export class ContentPage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column({ name: 'title_ar' })
  titleAr: string;

  @Column({ name: 'title_en' })
  titleEn: string;

  @Column({ name: 'body_ar', type: 'text' })
  bodyAr: string;

  @Column({ name: 'body_en', type: 'text' })
  bodyEn: string;
}
