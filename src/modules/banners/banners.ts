import { Controller, Get, Injectable, Module, OnModuleInit } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { ApiOk } from '../../common/swagger/api-response.js';
import { BannerModel } from '../../common/swagger/response-models.js';
import { Banner } from './banner.entity.js';

@Injectable()
export class BannersService implements OnModuleInit {
  constructor(@InjectRepository(Banner) private readonly repo: Repository<Banner>) {}

  async onModuleInit() {
    if ((await this.repo.count()) > 0) return;
    await this.repo.save(
      this.repo.create([
        { titleAr: 'تشكيلة جديدة', titleEn: 'New collection', subtitleAr: 'خصم 20% على الإطارات', subtitleEn: '20% off frames', imageUrl: 'https://picsum.photos/seed/banner-1/800/400', sortOrder: 0 },
        { titleAr: 'نظارات شمسية', titleEn: 'Sunglasses', subtitleAr: 'استعد للصيف', subtitleEn: 'Get ready for summer', imageUrl: 'https://picsum.photos/seed/banner-2/800/400', sortOrder: 1 },
      ]),
    );
  }

  findActive() {
    const now = new Date();
    return this.repo.find({
      where: [
        { isActive: true, startsAt: IsNull(), endsAt: IsNull() },
        { isActive: true, startsAt: LessThanOrEqual(now), endsAt: IsNull() },
        { isActive: true, startsAt: IsNull(), endsAt: MoreThanOrEqual(now) },
        { isActive: true, startsAt: LessThanOrEqual(now), endsAt: MoreThanOrEqual(now) },
      ],
      order: { sortOrder: 'ASC' },
    });
  }
}

@ApiTags('المحتوى')
@Controller('banners')
export class BannersController {
  constructor(private readonly service: BannersService) {}

  @Get()
  @ApiOperation({ summary: 'بنرات الرئيسية', description: 'البنرات المفعّلة داخل فترة عرضها فقط، مرتبة. `linkType` أحد: product و category و brand و url، و`linkValue` معرّف الهدف أو الرابط.' })
  @ApiOk(BannerModel, 'البنرات', { isArray: true })
  findAll() {
    return this.service.findActive();
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Banner])],
  controllers: [BannersController],
  providers: [BannersService],
})
export class BannersModule {}
