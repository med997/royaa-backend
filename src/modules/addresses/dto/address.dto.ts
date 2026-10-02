import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ description: 'اسم العنوان', example: 'المنزل' })
  @IsString()
  label: string;

  @ApiProperty({ description: 'تفاصيل العنوان (الشارع والمعلم)', example: 'شارع الزبيري، بجانب المسجد' })
  @IsString()
  line1: string;

  @ApiProperty({ description: 'المدينة', example: 'صنعاء' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'اسم المستلم', example: 'أحمد علي' })
  @IsString()
  recipientName: string;

  @ApiProperty({ description: 'جوال المستلم', example: '777123456' })
  @IsString()
  recipientPhone: string;

  @ApiPropertyOptional({ description: 'الحي / المنطقة', example: 'الحصبة' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'ملاحظات للمندوب', example: 'الدور الثاني' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'خط العرض (يُختار من خريطة جوجل)', minimum: -90, maximum: 90, example: 15.3694 })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ description: 'خط الطول (يُختار من خريطة جوجل)', minimum: -180, maximum: 180, example: 44.191 })
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({ description: 'جعله العنوان الافتراضي (يلغي الافتراضي السابق)', example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
