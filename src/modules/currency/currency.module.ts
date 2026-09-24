import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Currency } from './currency.entity.js';
import { CurrencyService } from './currency.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Currency])],
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
