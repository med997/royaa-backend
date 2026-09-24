import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity.js';
import { Product } from '../products/product.entity.js';
import { CreateReviewDto } from './dto/create-review.dto.js';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly repo: Repository<Review>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}

  async create(userId: string, productId: string, dto: CreateReviewDto) {
    const product = await this.products.findOne({ where: { id: productId, isActive: true } });
    if (!product) throw new NotFoundException('Product not found');

    await this.repo.save(this.repo.create({ user: { id: userId }, product: { id: productId }, rating: dto.rating, comment: dto.comment ?? null }));

    const stats = await this.repo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.product_id = :productId', { productId })
      .getRawOne<{ avg: string; count: string }>();
    const { avg, count } = stats ?? { avg: '0', count: '0' };

    product.rating = Math.round(Number(avg) * 100) / 100;
    product.ratingCount = Number(count);
    await this.products.save(product);

    return this.findAllForProduct(productId);
  }

  async findAllForProduct(productId: string) {
    const reviews = await this.repo.find({ where: { product: { id: productId } }, order: { createdAt: 'DESC' } });
    return reviews.map((r) => ({
      id: r.id,
      userName: r.user.userName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));
  }
}
