import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Vendor } from './entities/vendor.entity';
import { VendorService } from './entities/vendor-service.entity';
import { VendorAvailability } from './entities/vendor-availability.entity';
import { QueryVendorDto } from './dto/query-vendor.dto';
import { paginate, buildPaginatedResult } from '../../common/utils/pagination.util';

@Injectable()
export class VendorsRepository {
  constructor(
    @InjectRepository(Vendor) private readonly vendorRepo: Repository<Vendor>,
    @InjectRepository(VendorService) private readonly serviceRepo: Repository<VendorService>,
    @InjectRepository(VendorAvailability) private readonly availabilityRepo: Repository<VendorAvailability>,
  ) {}

  async findAll(query: QueryVendorDto) {
    const { skip, take } = paginate(query.page, query.limit);
    const where: any = { isVerified: true }; // public listing only shows verified vendors
    if (query.category) where.category = query.category;
    if (query.city) where.city = ILike(`%${query.city}%`);
    if (query.search) where.businessName = ILike(`%${query.search}%`);

    const [data, total] = await this.vendorRepo.findAndCount({
      where,
      skip,
      take,
      relations: ['user', 'services'],
    });
    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async findAllAdmin(query: QueryVendorDto) {
    const { skip, take } = paginate(query.page, query.limit);
    const where: any = {};
    if (query.category) where.category = query.category;
    if (query.city) where.city = ILike(`%${query.city}%`);
    if (query.isVerified !== undefined) where.isVerified = query.isVerified;
    if (query.search) where.businessName = ILike(`%${query.search}%`);

    const [data, total] = await this.vendorRepo.findAndCount({
      where,
      skip,
      take,
      relations: ['user', 'services'],
    });
    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  findById(id: string) {
    return this.vendorRepo.findOne({
      where: { id },
      relations: ['user', 'services'],
    });
  }

  findByUserId(userId: string) {
    return this.vendorRepo.findOne({
      where: { userId },
      relations: ['services', 'availability'],
    });
  }

  create(data: Partial<Vendor>) {
    return this.vendorRepo.save(this.vendorRepo.create(data));
  }

  async update(id: string, data: Partial<Vendor>) {
    await this.vendorRepo.update(id, data);
    return this.findById(id);
  }

  softDelete(id: string) {
    return this.vendorRepo.softDelete(id);
  }

  createService(data: Partial<VendorService>) {
    return this.serviceRepo.save(this.serviceRepo.create(data));
  }

  findServiceById(id: string) {
    return this.serviceRepo.findOne({ where: { id } });
  }

  deleteService(id: string) {
    return this.serviceRepo.delete(id);
  }

  // Availability
  findAvailabilityByVendor(vendorId: string) {
    return this.availabilityRepo.find({
      where: { vendorId },
      order: { date: 'ASC' },
    });
  }

  findAvailabilityById(id: string) {
    return this.availabilityRepo.findOne({ where: { id } });
  }

  saveAvailability(data: Partial<VendorAvailability>) {
    return this.availabilityRepo.save(this.availabilityRepo.create(data));
  }

  deleteAvailability(id: string) {
    return this.availabilityRepo.delete(id);
  }
}
