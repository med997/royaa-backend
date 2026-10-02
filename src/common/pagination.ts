import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class Paged<T> {
  constructor(
    readonly items: T[],
    readonly total: number,
  ) {}
}

export class PageQueryDto {
  @ApiPropertyOptional({ description: 'رقم الصفحة (يبدأ من 1)', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: 'عدد العناصر في الصفحة (الأقصى 100). الإجمالي في ترويسة X-Total-Count', minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;
}

export const pageOpts = (q: PageQueryDto) => ({ skip: (q.page - 1) * q.limit, take: q.limit });
