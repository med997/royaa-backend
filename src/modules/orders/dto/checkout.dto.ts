import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @ApiProperty({ description: 'معرّف عنوان التوصيل', example: '3f1c2b7e-8a4d-4c1e-9b6a-2d5e7f8a9b0c' })
  @IsString()
  addressId: string;

  @ApiProperty({ description: 'طريقة التوصيل: standard مجاني، express برسوم ثابتة (4$ محوّلة)', enum: ['standard', 'express'], example: 'standard' })
  @IsIn(['standard', 'express'])
  deliveryMethod: 'standard' | 'express';

  @ApiProperty({ description: 'طريقة الدفع: card بطاقة، wallet محفظة، cod عند الاستلام', enum: ['card', 'wallet', 'cod'], example: 'cod' })
  @IsIn(['card', 'wallet', 'cod'])
  paymentMethod: 'card' | 'wallet' | 'cod';

  @ApiPropertyOptional({ description: 'كود الخصم (يُتحقق منه عبر /coupons/validate)', example: 'WELCOME10' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ description: 'ملاحظات على الطلب' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'رمز العملة (الافتراضي YER) وتُثبَّت في الطلب', enum: ['YER', 'SAR', 'USD'], example: 'YER' })
  @IsOptional()
  @IsString()
  currency?: string;
}
