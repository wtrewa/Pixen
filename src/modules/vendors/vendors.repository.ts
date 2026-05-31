import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { Vendor } from './entities/vendor.entity';
import { VendorService } from './entities/vendor-service.entity';
import { VendorAvailability } from './entities/vendor-availability.entity';
import { VendorEquipment } from './entities/vendor-equipment.entity';
import { ServiceAddon } from './entities/service-addon.entity';
import { QueryVendorDto } from './dto/query-vendor.dto';
import { paginate, buildPaginatedResult } from '../../common/utils/pagination.util';

@Injectable()
export class VendorsRepository {
  constructor(
    @InjectRepository(Vendor) private readonly vendorRepo: Repository<Vendor>,
    @InjectRepository(VendorService) private readonly serviceRepo: Repository<VendorService>,
    @InjectRepository(VendorAvailability) private readonly availabilityRepo: Repository<VendorAvailability>,
    @InjectRepository(VendorEquipment) private readonly equipmentRepo: Repository<VendorEquipment>,
    @InjectRepository(ServiceAddon) private readonly addonRepo: Repository<ServiceAddon>,
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

  // ── Equipment ──────────────────────────────────────────────────────────────

  findEquipmentByVendor(vendorId: string) {
    return this.equipmentRepo.find({ where: { vendorId }, order: { category: 'ASC' } });
  }

  findEquipmentById(id: string) {
    return this.equipmentRepo.findOne({ where: { id } });
  }

  createEquipment(data: Partial<VendorEquipment>) {
    return this.equipmentRepo.save(this.equipmentRepo.create(data));
  }

  async updateEquipment(id: string, data: Partial<VendorEquipment>) {
    await this.equipmentRepo.update(id, data);
    return this.findEquipmentById(id);
  }

  deleteEquipment(id: string) {
    return this.equipmentRepo.delete(id);
  }

  // ── Service Add-ons ────────────────────────────────────────────────────────

  findAddonsByVendor(vendorId: string) {
    return this.addonRepo.find({ where: { vendorId, isActive: true }, order: { category: 'ASC' } });
  }

  findAddonById(id: string) {
    return this.addonRepo.findOne({ where: { id } });
  }

  findAddonsByIds(ids: string[]) {
    return this.addonRepo.find({ where: { id: In(ids) } });
  }

  createAddon(data: Partial<ServiceAddon>) {
    return this.addonRepo.save(this.addonRepo.create(data));
  }

  async updateAddon(id: string, data: Partial<ServiceAddon>) {
    await this.addonRepo.update(id, data);
    return this.findAddonById(id);
  }

  deleteAddon(id: string) {
    return this.addonRepo.delete(id);
  }
}
