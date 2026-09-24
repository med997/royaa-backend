import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './brand.entity.js';

const SEED = [{ name: 'Ray-Ban' }, { name: 'Oakley' }, { name: 'Persol' }, { name: 'Roya Studio' }];

@Injectable()
export class BrandsService implements OnModuleInit {
  constructor(@InjectRepository(Brand) private readonly repo: Repository<Brand>) {}

  async onModuleInit() {
    if ((await this.repo.count()) === 0) await this.repo.save(this.repo.create(SEED));
  }

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }
}
