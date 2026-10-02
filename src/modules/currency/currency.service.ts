import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from './currency.entity.js';

const SEED: Partial<Currency>[] = [
  { code: 'USD', symbol: '$', rateToBase: 1, isDefault: false },
  { code: 'SAR', symbol: 'ر.س', rateToBase: 3.75, isDefault: false },
  { code: 'YER', symbol: 'ر.ي', rateToBase: 250, isDefault: true },
];

@Injectable()
export class CurrencyService implements OnModuleInit {
  constructor(@InjectRepository(Currency) private readonly repo: Repository<Currency>) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count === 0) await this.repo.save(this.repo.create(SEED));
  }

  findActive() {
    return this.repo.find({ where: { isActive: true }, order: { code: 'ASC' } });
  }

  private async rate(code: string) {
    const currency = await this.repo.findOne({ where: { code, isActive: true } });
    if (!currency) throw new BadRequestException(`Unknown currency: ${code}`);
    return Number(currency.rateToBase);
  }

  async convertFromBaseMinorUnits(baseMinorUnits: number, targetCode: string) {
    return Math.round((baseMinorUnits / 100) * (await this.rate(targetCode)) * 100) / 100;
  }

  async toBaseMinorUnits(amount: number, code: string) {
    return Math.round((amount / (await this.rate(code))) * 100);
  }
}
