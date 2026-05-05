import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Not, Between } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { VendorService } from '../vendors/entities/vendor-service.entity';
import { paginate, buildPaginatedResult } from '../../common/utils/pagination.util';
import { BookingStatus } from '../../common/enums/booking-status.enum';

@Injectable()
export class BookingsRepository {
  constructor(@InjectRepository(Booking) private readonly repo: Repository<Booking>) {}

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ['customer', 'vendor', 'service'],
    });
  }

  async findByCustomer(customerId: string, page = 1, limit = 10, status?: BookingStatus) {
    const { skip, take } = paginate(page, limit);
    const [data, total] = await this.repo.findAndCount({
      where: { customerId, ...(status ? { status } : {}) },
      skip,
      take,
      relations: ['vendor', 'service'],
      order: { createdAt: 'DESC' },
    });
    return buildPaginatedResult(data, total, page, limit);
  }

  async findByVendor(vendorId: string, page = 1, limit = 10) {
    const { skip, take } = paginate(page, limit);
    const [data, total] = await this.repo.findAndCount({
      where: { vendorId },
      skip,
      take,
      relations: ['customer', 'service'],
      order: { createdAt: 'DESC' },
    });
    return buildPaginatedResult(data, total, page, limit);
  }

  create(data: Partial<Booking>) {
    return this.repo.save(this.repo.create(data));
  }

  async updateStatus(id: string, status: BookingStatus, cancellationReason?: string) {
    await this.repo.update(id, { status, ...(cancellationReason ? { cancellationReason } : {}) });
    return this.findById(id);
  }

  async update(id: string, data: Partial<Booking>) {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  softDelete(id: string) {
    return this.repo.softDelete(id);
  }

  async getBookingContext(vendorId: string, serviceId: string) {
    const [vendor, service] = await Promise.all([
      this.repo.manager.findOne(Vendor, { where: { id: vendorId } }),
      this.repo.manager.findOne(VendorService, { where: { id: serviceId } }),
    ]);
    return { vendor, service };
  }

  async findOverlapping(vendorId: string, start: Date, end: Date) {
    // Overlap logic: (start < b.endAt) AND (end > b.eventDate)
    return this.repo.find({
      where: {
        vendorId,
        eventDate: LessThan(end),
        endAt: MoreThan(start),
        status: Not(BookingStatus.CANCELLED),
      }
    });
  }
}
