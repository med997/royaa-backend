import { Body, Controller, Get, Injectable, Module, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Repository } from 'typeorm';
import { ApiErrors, ApiOk } from '../../common/swagger/api-response.js';
import { AuthModule } from '../auth/auth.module.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { FaceMeasurement } from './face-measurement.entity.js';

export class FaceMeasurementDto {
  @ApiPropertyOptional({ description: 'المسافة بين البؤبؤين (مم)', example: 63, minimum: 40, maximum: 80 })
  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(80)
  pdMm?: number;

  @ApiPropertyOptional({ description: 'عرض الوجه (مم)', example: 140, minimum: 90, maximum: 200 })
  @IsOptional()
  @IsNumber()
  @Min(90)
  @Max(200)
  faceWidthMm?: number;

  @ApiPropertyOptional({ description: 'شكل الوجه', enum: ['oval', 'round', 'square', 'heart', 'oblong'] })
  @IsOptional()
  @IsIn(['oval', 'round', 'square', 'heart', 'oblong'])
  faceShape?: string;
}

export class FaceMeasurementModel {
  @ApiProperty({ type: Number, nullable: true, example: 63 })
  pdMm: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 140 })
  faceWidthMm: number | null;

  @ApiProperty({ type: String, nullable: true, example: 'oval' })
  faceShape: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  updatedAt: Date | null;
}

@Injectable()
export class MeasurementsService {
  constructor(@InjectRepository(FaceMeasurement) private readonly repo: Repository<FaceMeasurement>) {}

  async get(userId: string) {
    const m = await this.repo.findOne({ where: { user: { id: userId } } });
    return { pdMm: m?.pdMm ?? null, faceWidthMm: m?.faceWidthMm ?? null, faceShape: m?.faceShape ?? null, updatedAt: m?.updatedAt ?? null };
  }

  async save(userId: string, dto: FaceMeasurementDto) {
    const m = (await this.repo.findOne({ where: { user: { id: userId } } })) ?? this.repo.create({ user: { id: userId } });
    await this.repo.save(Object.assign(m, dto));
    return this.get(userId);
  }
}

@ApiTags('القياسات')
@ApiBearerAuth()
@ApiErrors([401, 'غير مصرّح: الرمز مفقود أو غير صالح'])
@UseGuards(JwtAuthGuard)
@Controller('measurements/face')
export class MeasurementsController {
  constructor(private readonly service: MeasurementsService) {}

  @Get()
  @ApiOperation({ summary: 'قياسات وجهي', description: 'تُرجع قيماً null إن لم تُحفظ قياسات بعد.' })
  @ApiOk(FaceMeasurementModel, 'القياسات')
  get(@CurrentUser() user: { userId: string }) {
    return this.service.get(user.userId);
  }

  @Put()
  @ApiOperation({ summary: 'حفظ قياسات الوجه', description: 'يُنشئ السجل أو يحدّثه (سجل واحد لكل مستخدم).' })
  @ApiOk(FaceMeasurementModel, 'القياسات بعد الحفظ')
  save(@CurrentUser() user: { userId: string }, @Body() dto: FaceMeasurementDto) {
    return this.service.save(user.userId, dto);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([FaceMeasurement]), AuthModule],
  controllers: [MeasurementsController],
  providers: [MeasurementsService],
})
export class MeasurementsModule {}
