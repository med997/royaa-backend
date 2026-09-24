import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity.js';

const SEED = [
  { nameAr: 'كلاسيكي', nameEn: 'Classic' },
  { nameAr: 'دائري', nameEn: 'Round' },
  { nameAr: 'شمسي', nameEn: 'Sunglasses' },
];

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(@InjectRepository(Category) private readonly repo: Repository<Category>) {}

  async onModuleInit() {
    if ((await this.repo.count()) === 0) await this.repo.save(this.repo.create(SEED));
  }

  findAll() {
    return this.repo.find({ order: { nameEn: 'ASC' } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }
}
