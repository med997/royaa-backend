import { Controller, Get, Injectable, Module, OnModuleInit } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiOk } from '../../common/swagger/api-response.js';
import { StoreModel } from '../../common/swagger/response-models.js';
import { Store } from './store.entity.js';

@Injectable()
export class StoresService implements OnModuleInit {
  constructor(@InjectRepository(Store) private readonly repo: Repository<Store>) {}

  async onModuleInit() {
    if ((await this.repo.count()) > 0) return;
    await this.repo.save(
      this.repo.create({
        nameAr: 'فرع صنعاء',
        nameEn: 'Sanaa Branch',
        addressAr: 'شارع الزبيري، صنعاء',
        addressEn: 'Al-Zubairi St, Sanaa',
        city: 'صنعاء',
        latitude: 15.3547,
        longitude: 44.2067,
        phone: '+967777000000',
        workingHours: '9:00 - 22:00',
      }),
    );
  }

  findActive() {
    return this.repo.find({ where: { isActive: true }, order: { city: 'ASC', nameEn: 'ASC' } });
  }
}

@ApiTags('المحتوى')
@Controller('stores')
export class StoresController {
  constructor(private readonly service: StoresService) {}

  @Get()
  @ApiOperation({ summary: 'فروع المتجر', description: 'الفروع المفعّلة مع الموقع الجغرافي وساعات العمل.' })
  @ApiOk(StoreModel, 'الفروع', { isArray: true })
  findAll() {
    return this.service.findActive();
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Store])],
  controllers: [StoresController],
  providers: [StoresService],
})
export class StoresModule {}
