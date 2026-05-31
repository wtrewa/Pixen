import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { VendorsRepository } from './vendors.repository';
import { Vendor } from './entities/vendor.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { CreateAddonDto } from './dto/create-addon.dto';
import { QueryVendorDto } from './dto/query-vendor.dto';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { CACHE_KEYS } from '../../common/constants';

import { BookingsRepository } from '../bookings/bookings.repository';

@Injectable()
export class VendorsService {
  constructor(
    private readonly vendorsRepository: VendorsRepository,
    private readonly bookingsRepository: BookingsRepository,
    private readonly redis: RedisService,
  ) {}

  async getStats(vendorId: string, userId: string) {
    const vendor = await this.findOne(vendorId);
    if (vendor.userId !== userId) throw new ForbiddenException();

    // In a real app, you'd use a more complex query or a separate stats table
    // For now we derive from the bookings repository which is already injected
    const bookings = await this.bookingsRepository.findByVendor(vendorId, 1, 1000);
    const items = bookings.data;

    const stats = {
      totalRevenue: items
        .filter(b => ['CONFIRMED', 'SHOOT_COMPLETED', 'DELIVERED', 'COMPLETED'].includes(b.status))
        .reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0),
      activeLeads: items.filter(b => b.status === 'PENDING').length,
      upcomingEvents: items.filter(b => 
        (b.status === 'CONFIRMED') && 
        new Date(b.eventDate) > new Date()
      ).length,
      totalInquiries: items.length,
    };

    return { data: stats };
  }

  async register(userId: string, dto: CreateVendorDto) {
    const exists = await this.vendorsRepository.findByUserId(userId);
    if (exists) throw new ConflictException('Vendor profile already exists');
    const vendor = await this.vendorsRepository.create({ ...dto, userId });
    // Invalidate user cache so GET /users/me returns the newly linked vendor
    await this.redis.del(CACHE_KEYS.USER_PROFILE(userId));
    return vendor;
  }

  async findAll(query: QueryVendorDto) {
    const cacheKey = CACHE_KEYS.VENDOR_LIST + JSON.stringify(query);
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const result = await this.vendorsRepository.findAll(query);
    await this.redis.set(cacheKey, result, 120);
    return result;
  }

  async findAllForAdmin(query: QueryVendorDto) {
    return this.vendorsRepository.findAllAdmin(query);
  }

  async findOne(id: string): Promise<Vendor> {
    const cached = await this.redis.get<Vendor>(CACHE_KEYS.VENDOR_DETAIL(id));
    if (cached) return cached;

    const vendor = await this.vendorsRepository.findById(id);
    if (!vendor) throw new NotFoundException(`Vendor ${id} not found`);

    await this.redis.set(CACHE_KEYS.VENDOR_DETAIL(id), vendor);
    return vendor;
  }

  async update(id: string, userId: string, dto: UpdateVendorDto) {
    const vendor = await this.findOne(id);
    if (vendor.userId !== userId) throw new ForbiddenException();
    const updated = await this.vendorsRepository.update(id, dto as any);
    await this.redis.del(CACHE_KEYS.VENDOR_DETAIL(id));
    await this.redis.delByPattern('vendor:list*');
    return updated;
  }

  async addService(vendorId: string, userId: string, dto: CreateServiceDto) {
    const vendor = await this.findOne(vendorId);
    if (vendor.userId !== userId) throw new ForbiddenException();
    return this.vendorsRepository.createService({ ...dto, vendorId });
  }

  async removeService(serviceId: string, userId: string) {
    const service = await this.vendorsRepository.findServiceById(serviceId);
    if (!service) throw new NotFoundException('Service not found');

    const vendor = await this.findOne(service.vendorId);
    if (vendor.userId !== userId) throw new ForbiddenException();

    await this.vendorsRepository.deleteService(serviceId);
  }

  async verify(id: string, isVerified: boolean) {
    const vendor = await this.findOne(id);
    const updated = await this.vendorsRepository.update(id, { isVerified } as any);
    await this.redis.del(CACHE_KEYS.VENDOR_DETAIL(id));
    return updated;
  }

  // Availability Management
  async getAvailability(vendorId: string) {
    const availability = await this.vendorsRepository.findAvailabilityByVendor(vendorId);
    return { data: availability };
  }

  async blockDate(vendorId: string, userId: string, date: string, reason?: string) {
    const vendor = await this.findOne(vendorId);
    if (vendor.userId !== userId) throw new ForbiddenException();

    // Check if already blocked
    const existing = await this.vendorsRepository.findAvailabilityByVendor(vendorId);
    if (existing.some(a => a.date === date)) {
      throw new ConflictException('Date is already blocked');
    }

    return this.vendorsRepository.saveAvailability({
      vendorId,
      date,
      reason,
      isBlocked: true,
    });
  }

  async unblockDate(availabilityId: string, userId: string) {
    const availability = await this.vendorsRepository.findAvailabilityById(availabilityId);
    if (!availability) throw new NotFoundException('Availability record not found');

    const vendor = await this.findOne(availability.vendorId);
    if (vendor.userId !== userId) throw new ForbiddenException();

    await this.vendorsRepository.deleteAvailability(availabilityId);
  }

  // ── Equipment Catalog ──────────────────────────────────────────────────────

  async getEquipment(vendorId: string) {
    const equipment = await this.vendorsRepository.findEquipmentByVendor(vendorId);
    return { data: equipment };
  }

  async addEquipment(vendorId: string, userId: string, dto: CreateEquipmentDto) {
    const vendor = await this.findOne(vendorId);
    if (vendor.userId !== userId) throw new ForbiddenException();
    return this.vendorsRepository.createEquipment({ ...dto, vendorId });
  }

  async updateEquipment(equipmentId: string, userId: string, data: Partial<CreateEquipmentDto>) {
    const equipment = await this.vendorsRepository.findEquipmentById(equipmentId);
    if (!equipment) throw new NotFoundException('Equipment not found');
    const vendor = await this.findOne(equipment.vendorId);
    if (vendor.userId !== userId) throw new ForbiddenException();
    return this.vendorsRepository.updateEquipment(equipmentId, data);
  }

  async removeEquipment(equipmentId: string, userId: string) {
    const equipment = await this.vendorsRepository.findEquipmentById(equipmentId);
    if (!equipment) throw new NotFoundException('Equipment not found');
    const vendor = await this.findOne(equipment.vendorId);
    if (vendor.userId !== userId) throw new ForbiddenException();
    await this.vendorsRepository.deleteEquipment(equipmentId);
  }

  // ── Service Add-ons ────────────────────────────────────────────────────────

  async getAddons(vendorId: string) {
    const addons = await this.vendorsRepository.findAddonsByVendor(vendorId);
    return { data: addons };
  }

  async addAddon(vendorId: string, userId: string, dto: CreateAddonDto) {
    const vendor = await this.findOne(vendorId);
    if (vendor.userId !== userId) throw new ForbiddenException();
    return this.vendorsRepository.createAddon({ ...dto, vendorId });
  }

  async updateAddon(addonId: string, userId: string, data: Partial<CreateAddonDto>) {
    const addon = await this.vendorsRepository.findAddonById(addonId);
    if (!addon) throw new NotFoundException('Add-on not found');
    const vendor = await this.findOne(addon.vendorId);
    if (vendor.userId !== userId) throw new ForbiddenException();
    return this.vendorsRepository.updateAddon(addonId, data);
  }

  async removeAddon(addonId: string, userId: string) {
    const addon = await this.vendorsRepository.findAddonById(addonId);
    if (!addon) throw new NotFoundException('Add-on not found');
    const vendor = await this.findOne(addon.vendorId);
    if (vendor.userId !== userId) throw new ForbiddenException();
    await this.vendorsRepository.deleteAddon(addonId);
  }
}
