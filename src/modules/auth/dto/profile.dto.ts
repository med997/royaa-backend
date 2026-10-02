import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'رمز التجديد المُستلم عند الدخول' })
  @IsString()
  refreshToken: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'رقم الجوال', example: '777123456' })
  @IsString()
  mobileNo: string;

  @ApiProperty({ description: 'رمز التحقق OTP', example: '1234' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'كلمة المرور الجديدة (6 أحرف على الأقل)', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'كلمة المرور الحالية' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'كلمة المرور الجديدة (6 أحرف على الأقل)', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'الاسم', example: 'أحمد علي' })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiPropertyOptional({ description: 'البريد الإلكتروني' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'رابط الصورة الشخصية' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'لغة المستخدم المفضلة', enum: ['ar', 'en'] })
  @IsOptional()
  @IsIn(['ar', 'en'])
  language?: string;

  @ApiPropertyOptional({ description: 'عملة المستخدم المفضلة', enum: ['YER', 'SAR', 'USD'] })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'رمز FCM لإشعارات الجهاز' })
  @IsOptional()
  @IsString()
  fcmToken?: string;
}
