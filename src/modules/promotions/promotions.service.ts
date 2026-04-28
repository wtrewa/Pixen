import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer, OfferTarget } from './entities/offer.entity';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
  ) {}

  async create(dto: Partial<Offer>) {
    const exists = await this.offerRepo.findOne({ where: { code: dto.code } });
    if (exists) throw new ConflictException('Offer code already exists');
    return this.offerRepo.save(this.offerRepo.create(dto));
  }

  async findAll(target?: OfferTarget) {
    const where: any = {};
    if (target) where.target = target;
    return this.offerRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const offer = await this.offerRepo.findOne({ where: { id } });
    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  async validateCode(code: string) {
    const offer = await this.offerRepo.findOne({ where: { code, isActive: true } });
    if (!offer) throw new NotFoundException('Offer code is invalid or inactive');
    if (offer.expiryDate && new Date(offer.expiryDate) < new Date()) {
      throw new BadRequestException('Offer code has expired');
    }
    if (offer.usageLimit > 0 && offer.usageCount >= offer.usageLimit) {
      throw new BadRequestException('Offer usage limit has been reached');
    }
    return offer;
  }

  async remove(id: string) {
    const offer = await this.findOne(id);
    await this.offerRepo.remove(offer);
    return { message: 'Offer deleted successfully' };
  }

  async toggleStatus(id: string) {
    const offer = await this.findOne(id);
    offer.isActive = !offer.isActive;
    return this.offerRepo.save(offer);
  }
}
