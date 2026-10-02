import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paged, PageQueryDto, pageOpts } from '../../common/pagination.js';
import { OrderItem } from '../orders/order-item.entity.js';
import { Product } from '../products/product.entity.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { Review } from './review.entity.js';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly repo: Repository<Review>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(OrderItem) private readonly orderItems: Repository<OrderItem>,
  ) {}

  private async recomputeRating(productId: string) {
    const stats = await this.repo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.product_id = :productId', { productId })
      .getRawOne<{ avg: string | null; count: string }>();
    await this.products.update(productId, { rating: Math.round(Number(stats?.avg ?? 0) * 100) / 100, ratingCount: Number(stats?.count ?? 0) });
  }

  async create(userId: string, productId: string, dto: CreateReviewDto) {
    const product = await this.products.findOne({ where: { id: productId, isActive: true } });
    if (!product) throw new NotFoundException('Product not found');
    if (await this.repo.findOne({ where: { user: { id: userId }, product: { id: productId } } })) {
      throw new ConflictException('You already reviewed this product');
    }

    const purchased = await this.orderItems.count({ where: { productId, order: { user: { id: userId } } } });
    await this.repo.save(
      this.repo.create({ user: { id: userId }, product: { id: productId }, rating: dto.rating, comment: dto.comment ?? null, isVerifiedPurchase: purchased > 0 }),
    );
    await this.recomputeRating(productId);
    return this.findAllForProduct(productId, new PageQueryDto());
  }

  private async findOwned(userId: string, id: string) {
    const review = await this.repo.findOne({ where: { id }, relations: { product: true } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.user.id !== userId) throw new ForbiddenException();
    return review;
  }

  async update(userId: string, id: string, dto: Partial<CreateReviewDto>) {
    const review = await this.findOwned(userId, id);
    Object.assign(review, dto);
    await this.repo.save(review);
    await this.recomputeRating(review.product.id);
    return this.toDto(review);
  }

  async remove(userId: string, id: string) {
    const review = await this.findOwned(userId, id);
    await this.repo.remove(review);
    await this.recomputeRating(review.product.id);
  }

  private toDto(r: Review) {
    return { id: r.id, userName: r.user.userName, rating: r.rating, comment: r.comment, isVerifiedPurchase: r.isVerifiedPurchase, createdAt: r.createdAt };
  }

  async findAllForProduct(productId: string, q: PageQueryDto) {
    const [reviews, total] = await this.repo.findAndCount({ where: { product: { id: productId } }, order: { createdAt: 'DESC' }, ...pageOpts(q) });
    return new Paged(reviews.map((r) => this.toDto(r)), total);
  }

  async adminList(productId: string | undefined, q: PageQueryDto) {
    const [reviews, total] = await this.repo.findAndCount({
      where: productId ? { product: { id: productId } } : {},
      relations: { product: true },
      order: { createdAt: 'DESC' },
      ...pageOpts(q),
    });
    return new Paged(reviews.map((r) => ({ ...this.toDto(r), productId: r.product.id, productName: r.product.nameEn })), total);
  }

  async adminRemove(id: string) {
    const review = await this.repo.findOne({ where: { id }, relations: { product: true } });
    if (!review) throw new NotFoundException('Review not found');
    await this.repo.remove(review);
    await this.recomputeRating(review.product.id);
  }
}
