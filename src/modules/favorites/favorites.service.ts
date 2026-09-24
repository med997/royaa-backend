import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './favorite.entity.js';
import { ProductsService } from '../products/products.service.js';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite) private readonly repo: Repository<Favorite>,
    private readonly products: ProductsService,
    private readonly config: ConfigService,
  ) {}

  async add(userId: string, productId: string) {
    const existing = await this.repo.findOne({ where: { user: { id: userId }, product: { id: productId } } });
    if (existing) return { productId, favorited: true };

    await this.repo.save(this.repo.create({ user: { id: userId }, product: { id: productId } }));
    return { productId, favorited: true };
  }

  async remove(userId: string, productId: string) {
    const existing = await this.repo.findOne({ where: { user: { id: userId }, product: { id: productId } } });
    if (!existing) throw new NotFoundException('Favorite not found');
    await this.repo.remove(existing);
    return { productId, favorited: false };
  }

  async findAll(userId: string, currencyCode?: string) {
    const code = currencyCode ?? this.config.get<string>('DEFAULT_CURRENCY', 'YER');
    const favorites = await this.repo.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' } });
    return Promise.all(favorites.map((f) => this.products.toPublic(f.product, code)));
  }
}
