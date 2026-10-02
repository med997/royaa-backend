import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from './prescription.entity.js';
import { CreatePrescriptionDto } from './dto/prescription.dto.js';

@Injectable()
export class PrescriptionsService {
  constructor(@InjectRepository(Prescription) private readonly repo: Repository<Prescription>) {}

  private toDto({ user, ...p }: Prescription) {
    return p;
  }

  async findAll(userId: string) {
    const items = await this.repo.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' } });
    return items.map((p) => this.toDto(p));
  }

  async create(userId: string, dto: CreatePrescriptionDto) {
    return this.toDto(await this.repo.save(this.repo.create({ ...dto, user: { id: userId } })));
  }

  async update(userId: string, id: string, dto: Partial<CreatePrescriptionDto>) {
    const item = await this.findOwned(userId, id);
    return this.toDto(await this.repo.save(Object.assign(item, dto)));
  }

  async remove(userId: string, id: string) {
    await this.repo.remove(await this.findOwned(userId, id));
  }

  async findOwned(userId: string, id: string) {
    const item = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!item) throw new NotFoundException('Prescription not found');
    return item;
  }
}
