import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'رقم الجوال', example: '777123456' })
  @IsString()
  mobileNo: string;

  @ApiProperty({ description: 'كلمة المرور', example: 'secret123' })
  @IsString()
  password: string;
}
