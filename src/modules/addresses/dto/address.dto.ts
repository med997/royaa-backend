import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  label: string;

  @IsString()
  line1: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
