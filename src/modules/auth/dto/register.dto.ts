import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: 'اسم المستخدم', example: 'أحمد علي' })
  @IsString()
  userName: string;

  @ApiProperty({ description: 'رقم الجوال (فريد)', example: '777123456' })
  @IsString()
  mobileNo: string;

  @ApiProperty({ description: 'كلمة المرور (6 أحرف على الأقل)', minLength: 6, example: 'secret123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ description: 'البريد الإلكتروني', example: 'ahmed@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
