import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ description: 'معرّف المنتج', example: '3f1c2b7e-8a4d-4c1e-9b6a-2d5e7f8a9b0c' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({ description: 'معرّف اللون/النسخة', example: '3f1c2b7e-8a4d-4c1e-9b6a-2d5e7f8a9b0c' })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiPropertyOptional({ description: 'نوع العدسة', enum: ['none', 'single_vision', 'progressive', 'blue_light', 'photochromic'] })
  @IsOptional()
  @IsIn(['none', 'single_vision', 'progressive', 'blue_light', 'photochromic'])
  lensType?: string;

  @ApiPropertyOptional({ description: 'معرّف وصفتك الطبية لهذا العنصر', example: '3f1c2b7e-8a4d-4c1e-9b6a-2d5e7f8a9b0c' })
  @IsOptional()
  @IsString()
  prescriptionId?: string;

  @ApiPropertyOptional({ description: 'الكمية (الافتراضي 1، وتُجمع مع الكمية الموجودة)', minimum: 1, default: 1, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ description: 'الكمية الجديدة (تستبدل القديمة)', minimum: 1, example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}
