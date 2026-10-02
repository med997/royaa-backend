import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ description: 'رقم الجوال المسجَّل', example: '777123456' })
  @IsString()
  mobileNo: string;
}

export class VerifyOtpDto {
  @ApiProperty({ description: 'رقم الجوال', example: '777123456' })
  @IsString()
  mobileNo: string;

  @ApiProperty({ description: 'رمز التحقق (حالياً ثابت 1234، صلاحيته 5 دقائق)', example: '1234' })
  @IsString()
  code: string;
}
