import { Module } from '@nestjs/common';
import { CurrencyModule } from '../currency/currency.module.js';
import { AppConfigController } from './app-config.controller.js';

@Module({
  imports: [CurrencyModule],
  controllers: [AppConfigController],
})
export class AppConfigModule {}
