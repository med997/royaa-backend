import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CurrencyService } from '../currency/currency.service.js';

@Controller('config')
export class AppConfigController {
  constructor(
    private readonly config: ConfigService,
    private readonly currency: CurrencyService,
  ) {}

  @Get()
  async getConfig() {
    const currencies = await this.currency.findActive();
    return {
      languages: this.config.get<string>('SUPPORTED_LANGUAGES', 'ar,en').split(','),
      defaultLanguage: this.config.get<string>('DEFAULT_LANGUAGE', 'ar'),
      currencies: currencies.map((c) => ({ code: c.code, symbol: c.symbol, rateToBase: c.rateToBase, isDefault: c.isDefault })),
      defaultCurrency: this.config.get<string>('DEFAULT_CURRENCY', 'YER'),
    };
  }
}
