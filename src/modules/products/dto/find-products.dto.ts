import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PageQueryDto } from '../../../common/pagination.js';

const bool = () => Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value));

export class FindProductsDto extends PageQueryDto {
  @ApiPropertyOptional({ description: 'تصفية حسب معرّف التصنيف' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'تصفية حسب معرّف الماركة' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({ description: 'بحث في الاسم العربي أو الإنجليزي أو SKU (غير حساس لحالة الأحرف)', example: 'arc' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'عملة الأسعار (الافتراضي YER)', enum: ['YER', 'SAR', 'USD'] })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'أقل سعر (بعملة `currency`)', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'أعلى سعر (بعملة `currency`)', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'الفئة', enum: ['men', 'women', 'unisex', 'kids'] })
  @IsOptional()
  @IsIn(['men', 'women', 'unisex', 'kids'])
  gender?: string;

  @ApiPropertyOptional({ description: 'شكل الإطار', example: 'round' })
  @IsOptional()
  @IsString()
  shape?: string;

  @ApiPropertyOptional({ description: 'خامة الإطار', example: 'acetate' })
  @IsOptional()
  @IsString()
  material?: string;

  @ApiPropertyOptional({ description: 'المنتجات المميّزة فقط' })
  @IsOptional()
  @bool()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'وصل حديثاً فقط' })
  @IsOptional()
  @bool()
  @IsBoolean()
  isNew?: boolean;

  @ApiPropertyOptional({ description: 'الأكثر مبيعاً فقط' })
  @IsOptional()
  @bool()
  @IsBoolean()
  isBestSeller?: boolean;

  @ApiPropertyOptional({ description: 'ترتيب النتائج (الافتراضي newest)', enum: ['newest', 'price_asc', 'price_desc', 'rating', 'popular'] })
  @IsOptional()
  @IsIn(['newest', 'price_asc', 'price_desc', 'rating', 'popular'])
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
}
