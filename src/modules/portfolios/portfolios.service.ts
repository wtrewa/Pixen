import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { PortfolioMedia } from './entities/portfolio-media.entity';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { VendorsRepository } from '../vendors/vendors.repository';
import { StorageService } from '../../infrastructure/storage/storage.service';

@Injectable()
export class PortfoliosService {
  constructor(
    @InjectRepository(Portfolio) private readonly portfolioRepo: Repository<Portfolio>,
    @InjectRepository(PortfolioMedia) private readonly mediaRepo: Repository<PortfolioMedia>,
    private readonly vendorsRepository: VendorsRepository,
    private readonly storageService: StorageService,
  ) {}

  async create(userId: string, dto: CreatePortfolioDto) {
    const vendor = await this.vendorsRepository.findByUserId(userId);
    if (!vendor) throw new NotFoundException('Vendor profile not found');
    return this.portfolioRepo.save(this.portfolioRepo.create({ ...dto, vendorId: vendor.id }));
  }

  async findByVendor(vendorId: string) {
    return this.portfolioRepo.find({
      where: { vendorId },
      relations: ['media'],
    });
  }

  async findOne(id: string) {
    const portfolio = await this.portfolioRepo.findOne({
      where: { id },
      relations: ['media'],
    });
    if (!portfolio) throw new NotFoundException('Portfolio not found');
    return portfolio;
  }

  async uploadMedia(portfolioId: string, userId: string, file: Express.Multer.File) {
    const portfolio = await this.findOne(portfolioId);
    const vendor = await this.vendorsRepository.findByUserId(userId);
    if (!vendor || portfolio.vendorId !== vendor.id) throw new ForbiddenException();

    const url = await this.storageService.upload(file, 'portfolios');
    return this.mediaRepo.save(this.mediaRepo.create({ portfolioId, url }));
  }

  async remove(id: string, userId: string) {
    const portfolio = await this.findOne(id);
    const vendor = await this.vendorsRepository.findByUserId(userId);
    if (!vendor || portfolio.vendorId !== vendor.id) throw new ForbiddenException();
    await this.portfolioRepo.softDelete(id);
  }
}
