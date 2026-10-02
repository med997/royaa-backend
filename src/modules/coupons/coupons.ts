import { BadRequestException, Body, Controller, Injectable, Module, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsOptional, IsString } from 'class-validator';
import { Repository } from 'typeorm';
import { ApiErrors, ApiOk } from '../../common/swagger/api-response.js';
import { AuthModule } from '../auth/auth.module.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CartModule } from '../cart/cart.module.js';
import { CartService } from '../cart/cart.service.js';
import { CurrencyModule } from '../currency/currency.module.js';
import { CurrencyService } from '../currency/currency.service.js';
import { Coupon } from './coupon.entity.js';

export class ValidateCouponDto {
  @ApiProperty({ description: 'كود الخصم', example: 'WELCOME10' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'عملة السلة (الافتراضي YER)', enum: ['YER', 'SAR', 'USD'] })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class CouponResultModel {
  @ApiProperty({ example: 'WELCOME10' })
  code: string;

  @ApiProperty({ enum: ['percent', 'fixed'] })
  discountType: string;

  @ApiProperty({ description: 'مبلغ الخصم بعملة السلة', example: 2400 })
  discount: number;

  @ApiProperty({ description: 'المجموع الفرعي بعد الخصم', example: 21600 })
  subtotalAfterDiscount: number;

  @ApiProperty({ example: 'YER' })
  currency: string;
}

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon) private readonly repo: Repository<Coupon>,
    private readonly currency: CurrencyService,
    private readonly cart: CartService,
    private readonly config: ConfigService,
  ) {}

  async apply(code: string, subtotal: number, currencyCode: string) {
    const coupon = await this.repo.findOne({ where: { code: code.trim().toUpperCase() } });
    if (!coupon || !coupon.isActive) throw new BadRequestException('Invalid coupon');
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) throw new BadRequestException('Coupon expired');
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) throw new BadRequestException('Coupon usage limit reached');
    if (coupon.minSubtotalBaseMinorUnits) {
      const min = await this.currency.convertFromBaseMinorUnits(coupon.minSubtotalBaseMinorUnits, currencyCode);
      if (subtotal < min) throw new BadRequestException(`Minimum order is ${min} ${currencyCode}`);
    }
    const raw = coupon.discountType === 'percent' ? (subtotal * coupon.value) / 100 : await this.currency.convertFromBaseMinorUnits(coupon.value, currencyCode);
    return { coupon, discount: Math.round(Math.min(raw, subtotal) * 100) / 100 };
  }

  async redeem(coupon: Coupon) {
    await this.repo.increment({ id: coupon.id }, 'usedCount', 1);
  }

  async validate(userId: string, dto: ValidateCouponDto) {
    const currency = dto.currency ?? this.config.get<string>('DEFAULT_CURRENCY', 'YER');
    const { subtotal } = await this.cart.findAll(userId, currency);
    const { coupon, discount } = await this.apply(dto.code, subtotal, currency);
    return { code: coupon.code, discountType: coupon.discountType, discount, subtotalAfterDiscount: Math.round((subtotal - discount) * 100) / 100, currency };
  }
}

@ApiTags('الكوبونات')
@ApiBearerAuth()
@ApiErrors([401, 'غير مصرّح: الرمز مفقود أو غير صالح'])
@UseGuards(JwtAuthGuard)
@Controller('coupons')
export class CouponsController {
  constructor(private readonly service: CouponsService) {}

  @Post('validate')
  @ApiOperation({ summary: 'التحقق من كوبون', description: 'يحسب الخصم على سلتك الحالية دون إنشاء طلب. نفس الكود يُرسل في `couponCode` عند إتمام الشراء.' })
  @ApiOk(CouponResultModel, 'الكوبون صالح', { status: 201 })
  @ApiErrors([400, 'الكوبون غير صالح أو منتهٍ أو لم يبلغ الحد الأدنى للطلب'])
  validate(@CurrentUser() user: { userId: string }, @Body() dto: ValidateCouponDto) {
    return this.service.validate(user.userId, dto);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Coupon]), AuthModule, CartModule, CurrencyModule],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
