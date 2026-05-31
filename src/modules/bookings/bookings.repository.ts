import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Not, In } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { BookingAddon } from './entities/booking-addon.entity';
import { BookingCustomRequest } from './entities/booking-custom-request.entity';
import { BookingCollaborator } from './entities/booking-collaborator.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { VendorService } from '../vendors/entities/vendor-service.entity';
import { ServiceAddon } from '../vendors/entities/service-addon.entity';
import { paginate, buildPaginatedResult } from '../../common/utils/pagination.util';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { CollaboratorStatus } from '../../common/enums/collaborator-status.enum';
import { CustomRequestStatus } from '../../common/enums/custom-request-status.enum';

@Injectable()
export class BookingsRepository {
  constructor(
    @InjectRepository(Booking) private readonly repo: Repository<Booking>,
    @InjectRepository(BookingAddon) private readonly addonRepo: Repository<BookingAddon>,
    @InjectRepository(BookingCustomRequest) private readonly customRequestRepo: Repository<BookingCustomRequest>,
    @InjectRepository(BookingCollaborator) private readonly collaboratorRepo: Repository<BookingCollaborator>,
    @InjectRepository(ServiceAddon) private readonly serviceAddonRepo: Repository<ServiceAddon>,
  ) {}

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

  // HOURLY: check if vendor has an overlapping hourly booking for a team slot
  async countHourlyConflicts(vendorId: string, start: Date, end: Date): Promise<number> {
    return this.repo.count({
      where: {
        vendorId,
        eventDate: LessThan(end),
        endAt: MoreThan(start),
        status: Not(BookingStatus.CANCELLED),
      },
    });
  }

  // MULTI_DATE: check if any of the individual dates already have a booking
  async countMultiDateConflicts(vendorId: string, dates: string[]): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('b')
      .where('b.vendor_id = :vendorId', { vendorId })
      .andWhere('b.status != :cancelled', { cancelled: BookingStatus.CANCELLED })
      .andWhere(
        `b.event_date::date = ANY(ARRAY[:...dates]::date[])`,
        { dates },
      )
      .getCount();
    return result;
  }

  // DATE_RANGE: check if the date range overlaps any existing booking range
  async countRangeConflicts(vendorId: string, start: Date, end: Date): Promise<number> {
    return this.repo
      .createQueryBuilder('b')
      .where('b.vendor_id = :vendorId', { vendorId })
      .andWhere('b.status != :cancelled', { cancelled: BookingStatus.CANCELLED })
      .andWhere('b.event_date <= :end', { end })
      .andWhere('COALESCE(b.end_date, b.event_date) >= :start', { start })
      .getCount();
  }

  // ── Add-ons ────────────────────────────────────────────────────────────────

  findServiceAddonsByIds(ids: string[]) {
    return this.serviceAddonRepo.find({ where: { id: In(ids) } });
  }

  saveBookingAddons(addons: Partial<BookingAddon>[]) {
    return this.addonRepo.save(addons.map((a) => this.addonRepo.create(a)));
  }

  findAddonsByBooking(bookingId: string) {
    return this.addonRepo.find({ where: { bookingId }, relations: ['addon'] });
  }

  // ── Custom Requests ────────────────────────────────────────────────────────

  saveCustomRequests(requests: Partial<BookingCustomRequest>[]) {
    return this.customRequestRepo.save(requests.map((r) => this.customRequestRepo.create(r)));
  }

  findCustomRequestsByBooking(bookingId: string) {
    return this.customRequestRepo.find({ where: { bookingId } });
  }

  findCustomRequestById(id: string) {
    return this.customRequestRepo.findOne({ where: { id } });
  }

  async updateCustomRequest(id: string, data: Partial<BookingCustomRequest>) {
    await this.customRequestRepo.update(id, data);
    return this.findCustomRequestById(id);
  }

  // ── Collaborators ──────────────────────────────────────────────────────────

  saveCollaborator(data: Partial<BookingCollaborator>) {
    return this.collaboratorRepo.save(this.collaboratorRepo.create(data));
  }

  findCollaboratorsByBooking(bookingId: string) {
    return this.collaboratorRepo.find({
      where: { bookingId },
      relations: ['collaboratorVendor', 'collaboratorVendor.user'],
    });
  }

  findCollaboratorById(id: string) {
    return this.collaboratorRepo.findOne({
      where: { id },
      relations: ['booking', 'collaboratorVendor'],
    });
  }

  async updateCollaborator(id: string, data: Partial<BookingCollaborator>) {
    await this.collaboratorRepo.update(id, data);
    return this.findCollaboratorById(id);
  }

  findCollaboratorInvites(collaboratorVendorId: string) {
    return this.collaboratorRepo.find({
      where: { collaboratorVendorId, status: CollaboratorStatus.INVITED },
      relations: ['booking', 'primaryVendor'],
    });
  }
}
