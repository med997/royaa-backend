import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './brand.entity.js';

const SEED = ['Ray-Ban', 'Oakley', 'Persol', 'Roya Studio'].map((name) => ({ name, logoUrl: `https://picsum.photos/seed/brand-${name.toLowerCase().replace(/\W+/g, '-')}/300/300` }));

@Injectable()
export class BrandsService implements OnModuleInit {
  constructor(@InjectRepository(Brand) private readonly repo: Repository<Brand>) {}

  async onModuleInit() {
    for (const item of SEED) {
      const existing = await this.repo.findOne({ where: { name: item.name } });
      if (!existing) await this.repo.save(this.repo.create(item));
      else if (!existing.logoUrl) await this.repo.update(existing.id, { logoUrl: item.logoUrl });
    }
  }

  findAll() {
    return this.repo.find({ where: { isActive: true }, order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }
}
