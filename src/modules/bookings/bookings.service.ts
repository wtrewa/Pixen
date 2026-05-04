import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BookingsRepository } from './bookings.repository';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { DeliverBookingDto } from './dto/deliver-booking.dto';
import { ConfirmBookingDto } from './dto/confirm-booking.dto';
import { assertValidTransition } from './state-machine/booking.state-machine';
import { QUEUES } from '../../common/constants';
import { Role } from '../../common/enums/roles.enum';
import { User } from '../users/entities/user.entity';
import { BookingStatus } from '../../common/enums/booking-status.enum';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly bookingsRepository: BookingsRepository,
    @InjectQueue(QUEUES.NOTIFICATIONS) private readonly notifyQueue: Queue,
  ) {}

  async create(customer: User, dto: CreateBookingDto) {
    // 1. Get vendor and service details
    const bookingDetails = await this.bookingsRepository.getBookingContext(dto.vendorId, dto.serviceId);
    const { vendor, service } = bookingDetails;

    if (!vendor) throw new NotFoundException('Vendor not found');
    if (!service) throw new NotFoundException('Service not found');

    // 2. Calculate Block-out period (Duration + 6hr Buffer)
    const startAt = new Date(dto.eventDate);
    const duration = Number(service.duration || 1); // Default to 1hr if not set
    const endAt = new Date(startAt.getTime() + (duration + 6) * 60 * 60 * 1000);

    // 3. Find an available team
    const teamIndex = await this.findAvailableTeam(dto.vendorId, startAt, endAt, vendor.teamCount);
    if (teamIndex === -1) {
      throw new ForbiddenException('All teams are fully booked for this time slot (including mandatory 6hr rest period)');
    }

    const booking = await this.bookingsRepository.create({
      ...dto,
      customerId: customer.id,
      eventDate: startAt,
      endAt: endAt,
      teamIndex: teamIndex,
    });

    // Invalidate vendor list cache if any
    // Note: Bookings aren't heavily cached yet but we should be safe
    
    this.notifyQueue.add('booking-created', {
      bookingId: booking.id,
      customerId: customer.id,
      vendorId: dto.vendorId,
    }).catch((err) => this.logger.warn(`notify queue error: ${err?.message}`));

    return { message: 'Booking created', data: booking };
  }

  async findOne(id: string, user: User) {
    const booking = await this.bookingsRepository.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');

    const isOwner =
      booking.customerId === user.id ||
      booking.vendor?.userId === user.id ||
      [Role.ADMIN, Role.SUPER_ADMIN].includes(user.role);

    if (!isOwner) throw new ForbiddenException();
    return booking;
  }

  findMyBookings(customerId: string, page: number, limit: number) {
    return this.bookingsRepository.findByCustomer(customerId, page, limit);
  }

  findVendorBookings(vendorId: string, page: number, limit: number) {
    return this.bookingsRepository.findByVendor(vendorId, page, limit);
  }

  async confirmByVendor(id: string, user: User, dto: ConfirmBookingDto) {
    const booking = await this.bookingsRepository.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');

    if (user.role !== Role.ADMIN && booking.vendor?.userId !== user.id) {
      throw new ForbiddenException('Only the assigned vendor can confirm this booking');
    }

    assertValidTransition(booking.status, BookingStatus.CONFIRMED);

    const updated = await this.bookingsRepository.update(id, {
      status: BookingStatus.CONFIRMED,
      advanceAmount: dto.advanceAmount,
    });

    await this.notifyQueue.add('booking-status-changed', {
      bookingId: id,
      newStatus: BookingStatus.CONFIRMED,
      customerId: booking.customerId,
      vendorId: booking.vendorId,
    });

    return { message: 'Booking confirmed. Customer can now pay the advance to secure the date.', data: updated };
  }

  async updateStatus(id: string, user: User, dto: UpdateBookingStatusDto) {
    const booking = await this.findOne(id, user);
    assertValidTransition(booking.status, dto.status);

    const updated = await this.bookingsRepository.updateStatus(
      id,
      dto.status,
      dto.cancellationReason,
    );

    await this.notifyQueue.add('booking-status-changed', {
      bookingId: id,
      newStatus: dto.status,
      customerId: booking.customerId,
      vendorId: booking.vendorId,
    });

    return { message: 'Booking status updated', data: updated };
  }

  async completeShoot(id: string, user: User) {
    const booking = await this.findOne(id, user);
    
    // Only the vendor or admin can mark shoot as done
    if (booking.vendor?.userId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only the assigned vendor can complete the shoot');
    }

    assertValidTransition(booking.status, BookingStatus.SHOOT_COMPLETED);

    const updated = await this.bookingsRepository.update(id, {
      status: BookingStatus.SHOOT_COMPLETED,
      shootCompletedAt: new Date(),
    });

    const availableAgain = new Date(Date.now() + 6 * 60 * 60 * 1000);

    await this.notifyQueue.add('shoot-completed', {
      bookingId: id,
      customerId: booking.customerId,
      vendorId: booking.vendorId,
      teamIndex: booking.teamIndex,
      availableAgain: availableAgain.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    });

    return { message: 'Shoot marked as completed', data: updated };
  }

  async deliver(id: string, user: User, dto: DeliverBookingDto) {
    const booking = await this.findOne(id, user);

    if (booking.vendor?.userId !== user.id) {
      throw new ForbiddenException('Only the assigned vendor can deliver files');
    }

    assertValidTransition(booking.status, BookingStatus.DELIVERED);

    const updated = await this.bookingsRepository.update(id, {
      status: BookingStatus.DELIVERED,
      deliveryLink: dto.deliveryLink,
      deliveredAt: new Date(),
      notes: dto.notes ? `${booking.notes}\n\nDelivery Notes: ${dto.notes}` : booking.notes,
    });

    await this.notifyQueue.add('booking-delivered', {
      bookingId: id,
      customerId: booking.customerId,
      deliveryLink: dto.deliveryLink,
    });

    return { message: 'Files delivered successfully', data: updated };
  }

  private async findAvailableTeam(vendorId: string, start: Date, end: Date, teamCount: number): Promise<number> {
    // Get all overlapping bookings for this vendor
    const existing = await this.bookingsRepository.findOverlapping(vendorId, start, end);

    // Check each team (0 to teamCount-1)
    for (let i = 0; i < teamCount; i++) {
      const isTeamBusy = existing.some(b => b.teamIndex === i && b.status !== BookingStatus.CANCELLED);
      if (!isTeamBusy) return i;
    }

    return -1; // All teams are busy
  }
}
