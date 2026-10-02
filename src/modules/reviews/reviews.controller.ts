import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags, PartialType } from '@nestjs/swagger';
import { PageQueryDto } from '../../common/pagination.js';
import { ApiErrors, ApiNoData, ApiOk } from '../../common/swagger/api-response.js';
import { ReviewModel } from '../../common/swagger/response-models.js';

class UpdateReviewDto extends PartialType(CreateReviewDto) {}

@ApiTags('التقييمات')
@Controller()
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Get('products/:productId/reviews')
  @ApiParam({ name: 'productId', description: 'معرّف المنتج' })
  @ApiOperation({ summary: 'تقييمات منتج', description: 'مرتبة من الأحدث. لا تتطلب مصادقة. الإجمالي في ترويسة `X-Total-Count`.' })
  @ApiOk(ReviewModel, 'التقييمات', { isArray: true })
  findAll(@Param('productId') productId: string, @Query() q: PageQueryDto) {
    return this.service.findAllForProduct(productId, q);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'productId', description: 'معرّف المنتج' })
  @ApiOperation({ summary: 'إضافة تقييم', description: 'تقييم واحد لكل مستخدم لكل منتج. يُعيد حساب متوسط التقييم ويضع شارة `isVerifiedPurchase` إن كان المستخدم اشترى المنتج.' })
  @ApiOk(ReviewModel, 'التقييمات بعد الإضافة', { isArray: true, status: 201 })
  @ApiErrors([401, 'غير مصرّح: الرمز مفقود أو غير صالح'], [404, 'المنتج غير موجود'], [409, 'قيّمت هذا المنتج مسبقاً'])
  @Post('products/:productId/reviews')
  create(@CurrentUser() user: { userId: string }, @Param('productId') productId: string, @Body() dto: CreateReviewDto) {
    return this.service.create(user.userId, productId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تعديل تقييمي', description: 'تقييمك أنت فقط. يُعاد حساب متوسط المنتج.' })
  @ApiParam({ name: 'id', description: 'معرّف التقييم' })
  @ApiOk(ReviewModel, 'بعد التعديل')
  @ApiErrors([401, 'غير مصرّح: الرمز مفقود أو غير صالح'], [403, 'ليس تقييمك'], [404, 'التقييم غير موجود'])
  @Patch('reviews/:id')
  update(@CurrentUser() user: { userId: string }, @Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return this.service.update(user.userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف تقييمي' })
  @ApiParam({ name: 'id', description: 'معرّف التقييم' })
  @ApiNoData('تم الحذف')
  @ApiErrors([401, 'غير مصرّح: الرمز مفقود أو غير صالح'], [403, 'ليس تقييمك'], [404, 'التقييم غير موجود'])
  @Delete('reviews/:id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.service.remove(user.userId, id);
  }
}
