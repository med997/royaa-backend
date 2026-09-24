import { IsIn, IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @IsString()
  addressId: string;

  @IsIn(['standard', 'express'])
  deliveryMethod: 'standard' | 'express';

  @IsIn(['card', 'wallet', 'cod'])
  paymentMethod: 'card' | 'wallet' | 'cod';

  @IsOptional()
  @IsString()
  currency?: string;
}
