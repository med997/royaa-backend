import { IsString } from 'class-validator';

export class SendOtpDto {
  @IsString()
  mobileNo: string;
}

export class VerifyOtpDto {
  @IsString()
  mobileNo: string;

  @IsString()
  code: string;
}
