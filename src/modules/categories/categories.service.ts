import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity.js';

const SEED = [
  { nameAr: 'كلاسيكي', nameEn: 'Classic', imageUrl: 'https://picsum.photos/seed/cat-classic/400/400' },
  { nameAr: 'دائري', nameEn: 'Round', imageUrl: 'https://picsum.photos/seed/cat-round/400/400' },
  { nameAr: 'شمسي', nameEn: 'Sunglasses', imageUrl: 'https://picsum.photos/seed/cat-sun/400/400' },
];

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(@InjectRepository(Category) private readonly repo: Repository<Category>) {}

  async onModuleInit() {
    for (const item of SEED) {
      const existing = await this.repo.findOne({ where: { nameEn: item.nameEn } });
      if (!existing) await this.repo.save(this.repo.create(item));
      else if (!existing.imageUrl) await this.repo.update(existing.id, { imageUrl: item.imageUrl });
    }
  }

  findAll() {
    return this.repo.find({ where: { isActive: true }, order: { sortOrder: 'ASC', nameEn: 'ASC' } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }
}
