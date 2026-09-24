import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './address.entity.js';
import { CreateAddressDto } from './dto/address.dto.js';

@Injectable()
export class AddressesService {
  constructor(@InjectRepository(Address) private readonly repo: Repository<Address>) {}

  private toDto(address: Address) {
    return { id: address.id, label: address.label, line1: address.line1, city: address.city, isDefault: address.isDefault };
  }

  async findAll(userId: string) {
    const addresses = await this.repo.find({ where: { user: { id: userId } }, order: { isDefault: 'DESC' } });
    return addresses.map((a) => this.toDto(a));
  }

  async create(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) await this.repo.update({ user: { id: userId } }, { isDefault: false });
    const address = await this.repo.save(this.repo.create({ ...dto, user: { id: userId } }));
    return this.toDto(address);
  }

  async remove(userId: string, id: string) {
    const address = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!address) throw new NotFoundException('Address not found');
    await this.repo.remove(address);
  }

  findById(userId: string, id: string) {
    return this.repo.findOne({ where: { id, user: { id: userId } } });
  }
}
