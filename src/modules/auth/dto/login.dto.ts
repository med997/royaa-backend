import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  mobileNo: string;

  @IsString()
  password: string;
}
