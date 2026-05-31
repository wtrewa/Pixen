import {
  BadRequestException,
  ConflictException,
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
import { InviteCollaboratorDto } from './dto/invite-collaborator.dto';
import { RespondCollaboratorDto } from './dto/respond-collaborator.dto';
import { QuoteCustomRequestDto } from './dto/quote-custom-request.dto';
import { RespondCustomRequestDto } from './dto/respond-custom-request.dto';
import { assertValidTransition } from './state-machine/booking.state-machine';
import { QUEUES } from '../../common/constants';
import { Role } from '../../common/enums/roles.enum';
import { BookingType } from '../../common/enums/booking-type.enum';
import { CollaboratorStatus } from '../../common/enums/collaborator-status.enum';
import { CustomRequestStatus } from '../../common/enums/custom-request-status.enum';
import { User } from '../users/entities/user.entity';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { PromotionsService } from '../promotions/promotions.service';
import { OfferTarget, DiscountType } from '../promotions/entities/offer.entity';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly bookingsRepository: BookingsRepository,
    @InjectQueue(QUEUES.NOTIFICATIONS) private readonly notifyQueue: Queue,
    private readonly promotionsService: PromotionsService,
  ) {}

  async create(customer: User, dto: CreateBookingDto) {
    const { vendor, service } = await this.bookingsRepository.getBookingContext(dto.vendorId, dto.serviceId);
    if (!vendor) throw new NotFoundException('Vendor not found');
    if (!service) throw new NotFoundException('Service not found');

    if (service.bookingType !== dto.bookingType) {
      throw new BadRequestException(
        `This package only supports ${service.bookingType} bookings`,
      );
    }

    let eventDate: Date;
    let endAt: Date;
    let endDate: Date | undefined;
    let durationHours: number | undefined;
    let eventDates: { date: string; label: string }[] | undefined;

    switch (dto.bookingType) {
      case BookingType.FIXED: {
        if (!dto.startTime) throw new BadRequestException('FIXED booking requires startTime');
        eventDate = new Date(dto.startTime);
        endAt = new Date(eventDate.getTime() + 12 * 3600 * 1000);
        const teamIndex = await this.findAvailableTeam(dto.vendorId, eventDate, endAt, vendor.teamCount);
        if (teamIndex === -1) {
          throw new ConflictException('No team available for the selected time');
        }

        const totalAmount = Number(service.price);

        const booking = await this.bookingsRepository.create({
          customerId: customer.id,
          vendorId: dto.vendorId,
          serviceId: dto.serviceId,
          bookingType: dto.bookingType,
          eventDate,
          endAt,
          eventLocation: dto.eventLocation,
          notes: dto.notes,
          totalAmount,
          teamIndex,
        });
        const addonTotal = await this.processAddonsAndRequests(booking.id, dto.vendorId, dto.addons, dto.customRequests);
        const finalTotal = totalAmount + addonTotal;
        const promoResult = dto.promoCode ? await this.applyPromo(dto.promoCode, finalTotal, customer.role) : null;
        await this.bookingsRepository.update(booking.id, {
          totalAmount: finalTotal - (promoResult?.discountAmount ?? 0),
          ...(promoResult ? { promoCode: dto.promoCode.toUpperCase(), discountAmount: promoResult.discountAmount } : {}),
        });
        this.enqueueCreated(booking.id, customer.id, dto.vendorId);
        return { message: 'Booking created', data: await this.bookingsRepository.findById(booking.id) };
      }

      case BookingType.HOURLY: {
        if (!dto.startTime || !dto.durationHours) {
          throw new BadRequestException('HOURLY booking requires startTime and durationHours');
        }
        const min = Number(service.minHours ?? 0.5);
        const max = Number(service.maxHours ?? 24);
        if (dto.durationHours < min || dto.durationHours > max) {
          throw new BadRequestException(
            `Duration must be between ${min}–${max} hours for this package`,
          );
        }
        eventDate = new Date(dto.startTime);
        durationHours = dto.durationHours;
        // endAt = shoot end + 6hr mandatory rest buffer
        endAt = new Date(eventDate.getTime() + (dto.durationHours + 6) * 3600 * 1000);

        const teamIndex = await this.findAvailableTeam(dto.vendorId, eventDate, endAt, vendor.teamCount);
        if (teamIndex === -1) {
          throw new ConflictException('All teams are fully booked for this time slot (including mandatory 6hr rest period)');
        }

        const totalAmount = Number(service.price) * durationHours;

        const booking = await this.bookingsRepository.create({
          customerId: customer.id,
          vendorId: dto.vendorId,
          serviceId: dto.serviceId,
          bookingType: dto.bookingType,
          eventDate,
          endAt,
          durationHours,
          eventLocation: dto.eventLocation,
          notes: dto.notes,
          totalAmount,
          teamIndex,
        });
        const addonTotal = await this.processAddonsAndRequests(booking.id, dto.vendorId, dto.addons, dto.customRequests);
        const finalTotal = totalAmount + addonTotal;
        const promoResult = dto.promoCode ? await this.applyPromo(dto.promoCode, finalTotal, customer.role) : null;
        await this.bookingsRepository.update(booking.id, {
          totalAmount: finalTotal - (promoResult?.discountAmount ?? 0),
          ...(promoResult ? { promoCode: dto.promoCode.toUpperCase(), discountAmount: promoResult.discountAmount } : {}),
        });
        this.enqueueCreated(booking.id, customer.id, dto.vendorId);
        return { message: 'Booking created', data: await this.bookingsRepository.findById(booking.id) };
      }

      case BookingType.MULTI_DATE: {
        if (!dto.eventDates?.length) {
          throw new BadRequestException('MULTI_DATE booking requires at least one date');
        }
        const maxDates = service.maxDates ?? 1;
        if (dto.eventDates.length > maxDates) {
          throw new BadRequestException(
            `This package allows max ${maxDates} date(s). You selected ${dto.eventDates.length}.`,
          );
        }
        const sorted = [...dto.eventDates].sort((a, b) => a.date.localeCompare(b.date));
        const datesToCheck = sorted.map((d) => d.date);
        const teamIndex = await this.findAvailableTeamForMultiDate(dto.vendorId, datesToCheck, vendor.teamCount);
        if (teamIndex === -1) {
          throw new ConflictException('No team is available for all selected dates');
        }

        const totalAmount = Number(service.price) * datesToCheck.length;

        const booking = await this.bookingsRepository.create({
          customerId: customer.id,
          vendorId: dto.vendorId,
          serviceId: dto.serviceId,
          bookingType: dto.bookingType,
          eventDate: new Date(sorted[0].date),
          endAt: new Date(new Date(sorted[sorted.length - 1].date).getTime() + 30 * 3600 * 1000),
          eventDates: sorted,
          eventLocation: dto.eventLocation,
          notes: dto.notes,
          totalAmount,
          teamIndex,
        });
        const addonTotal = await this.processAddonsAndRequests(booking.id, dto.vendorId, dto.addons, dto.customRequests);
        const finalTotal = totalAmount + addonTotal;
        const promoResult = dto.promoCode ? await this.applyPromo(dto.promoCode, finalTotal, customer.role) : null;
        await this.bookingsRepository.update(booking.id, {
          totalAmount: finalTotal - (promoResult?.discountAmount ?? 0),
          ...(promoResult ? { promoCode: dto.promoCode.toUpperCase(), discountAmount: promoResult.discountAmount } : {}),
        });
        this.enqueueCreated(booking.id, customer.id, dto.vendorId);
        return { message: 'Booking created', data: await this.bookingsRepository.findById(booking.id) };
      }

      case BookingType.DATE_RANGE: {
        if (!dto.startDate || !dto.endDate) {
          throw new BadRequestException('DATE_RANGE booking requires startDate and endDate');
        }
        const start = new Date(dto.startDate);
        const end = new Date(dto.endDate);
        if (end < start) {
          throw new BadRequestException('endDate must be on or after startDate');
        }
        const dayCount = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
        const maxDays = service.maxDays ?? 1;
        if (dayCount > maxDays) {
          throw new BadRequestException(
            `This package allows max ${maxDays} day(s). Your range spans ${dayCount} day(s).`,
          );
        }

        eventDate = start;
        endDate = end;
        endAt = new Date(end.getTime() + 24 * 3600 * 1000);
        const teamIndex = await this.findAvailableTeam(dto.vendorId, eventDate, endAt, vendor.teamCount);
        if (teamIndex === -1) {
          throw new ConflictException('No team available for the selected date range');
        }

        const totalAmount = Number(service.price) * dayCount;

        const booking = await this.bookingsRepository.create({
          customerId: customer.id,
          vendorId: dto.vendorId,
          serviceId: dto.serviceId,
          bookingType: dto.bookingType,
          eventDate,
          endAt,
          endDate,
          eventLocation: dto.eventLocation,
          notes: dto.notes,
          totalAmount,
          teamIndex,
        });
        const addonTotal = await this.processAddonsAndRequests(booking.id, dto.vendorId, dto.addons, dto.customRequests);
        const finalTotal = totalAmount + addonTotal;
        const promoResult = dto.promoCode ? await this.applyPromo(dto.promoCode, finalTotal, customer.role) : null;
        await this.bookingsRepository.update(booking.id, {
          totalAmount: finalTotal - (promoResult?.discountAmount ?? 0),
          ...(promoResult ? { promoCode: dto.promoCode.toUpperCase(), discountAmount: promoResult.discountAmount } : {}),
        });
        this.enqueueCreated(booking.id, customer.id, dto.vendorId);
        return { message: 'Booking created', data: await this.bookingsRepository.findById(booking.id) };
      }
    }
  }

  private async applyPromo(
    code: string,
    totalAmount: number,
    userRole: string,
  ): Promise<{ discountAmount: number }> {
    const offer = await this.promotionsService.validateCode(code);

    // Enforce target audience
    if (offer.target !== OfferTarget.ALL) {
      const expectedRole = offer.target === OfferTarget.CUSTOMER ? Role.CUSTOMER : Role.VENDOR;
      if (userRole !== expectedRole) {
        throw new BadRequestException(
          `This promo code is only valid for ${offer.target.toLowerCase()}s`,
        );
      }
    }

    // Calculate discount
    let discountAmount: number;
    if (offer.discountType === DiscountType.PERCENTAGE) {
      discountAmount = Math.round((totalAmount * Number(offer.discountValue)) / 100);
    } else {
      discountAmount = Number(offer.discountValue);
    }
    // Never discount below zero
    discountAmount = Math.min(discountAmount, totalAmount);

    // Atomically increment usage count
    await this.promotionsService.incrementUsage(offer.id);

    return { discountAmount };
  }

  private async processAddonsAndRequests(
    bookingId: string,
    vendorId: string,
    addonItems: CreateBookingDto['addons'],
    customRequestDescs: string[] | undefined,
  ): Promise<number> {
    let addonTotal = 0;

    if (addonItems?.length) {
      const addonIds = addonItems.map((a) => a.addonId);
      const addonEntities = await this.bookingsRepository.findServiceAddonsByIds(addonIds);

      for (const item of addonItems) {
        const entity = addonEntities.find((e) => e.id === item.addonId);
        if (!entity) throw new NotFoundException(`Add-on ${item.addonId} not found`);
        if (entity.vendorId !== vendorId) throw new BadRequestException(`Add-on ${item.addonId} does not belong to this vendor`);
        if (!entity.isActive) throw new BadRequestException(`Add-on "${entity.name}" is no longer available`);
        if (item.quantity > entity.maxQuantity) {
          throw new BadRequestException(`Max quantity for "${entity.name}" is ${entity.maxQuantity}`);
        }
        addonTotal += Number(entity.price) * item.quantity;
      }

      await this.bookingsRepository.saveBookingAddons(
        addonItems.map((item) => {
          const entity = addonEntities.find((e) => e.id === item.addonId)!;
          return { bookingId, addonId: item.addonId, quantity: item.quantity, priceSnapshot: entity.price };
        }),
      );
    }

    if (customRequestDescs?.length) {
      await this.bookingsRepository.saveCustomRequests(
        customRequestDescs.map((description) => ({ bookingId, description })),
      );
    }

    return addonTotal;
  }

  private enqueueCreated(bookingId: string, customerId: string, vendorId: string) {
    this.notifyQueue
      .add('booking-created', { bookingId, customerId, vendorId })
      .catch((err) => this.logger.warn(`notify queue error: ${err?.message}`));
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

  findMyBookings(customerId: string, page: number, limit: number, status?: string) {
    return this.bookingsRepository.findByCustomer(customerId, page, limit, status as BookingStatus | undefined);
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
    const existing = await this.bookingsRepository.findOverlapping(vendorId, start, end);
    for (let i = 0; i < teamCount; i++) {
      const isTeamBusy = existing.some(b => b.teamIndex === i && b.status !== BookingStatus.CANCELLED);
      if (!isTeamBusy) return i;
    }
    return -1;
  }

  private async findAvailableTeamForMultiDate(vendorId: string, dates: string[], teamCount: number): Promise<number> {
    // 1. Get all overlapping bookings for the entire span (first date to last date)
    const sorted = [...dates].sort();
    const start = new Date(sorted[0]);
    const end = new Date(new Date(sorted[sorted.length - 1]).getTime() + 30 * 3600 * 1000);
    const existing = await this.bookingsRepository.findOverlapping(vendorId, start, end);

    // 2. For each team, check if it has conflicts on ANY of the specific dates
    for (let i = 0; i < teamCount; i++) {
      const teamBookings = existing.filter(b => b.teamIndex === i);
      const hasConflict = dates.some(dateStr => {
        const d = new Date(dateStr);
        const dEnd = new Date(d.getTime() + 30 * 3600 * 1000); // 24h + 6h rest
        return teamBookings.some(b => b.eventDate < dEnd && (b.endAt || b.eventDate) > d);
      });

      if (!hasConflict) return i;
    }
    return -1;
  }

  // ── Add-ons & Custom Requests ──────────────────────────────────────────────

  getBookingAddons(bookingId: string) {
    return this.bookingsRepository.findAddonsByBooking(bookingId);
  }

  getBookingCustomRequests(bookingId: string) {
    return this.bookingsRepository.findCustomRequestsByBooking(bookingId);
  }

  async quoteCustomRequest(requestId: string, user: User, dto: QuoteCustomRequestDto) {
    const request = await this.bookingsRepository.findCustomRequestById(requestId);
    if (!request) throw new NotFoundException('Custom request not found');

    const booking = await this.bookingsRepository.findById(request.bookingId);
    if (booking.vendor?.userId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only the assigned vendor can quote this request');
    }
    if (request.status !== CustomRequestStatus.PENDING) {
      throw new BadRequestException('Only PENDING requests can be quoted');
    }

    return this.bookingsRepository.updateCustomRequest(requestId, {
      quotedPrice: dto.quotedPrice,
      vendorResponse: dto.vendorResponse,
      status: CustomRequestStatus.QUOTED,
    });
  }

  async respondToCustomRequest(requestId: string, user: User, dto: RespondCustomRequestDto) {
    const request = await this.bookingsRepository.findCustomRequestById(requestId);
    if (!request) throw new NotFoundException('Custom request not found');

    const booking = await this.bookingsRepository.findById(request.bookingId);
    if (booking.customerId !== user.id) {
      throw new ForbiddenException('Only the customer can accept or reject a quote');
    }
    if (request.status !== CustomRequestStatus.QUOTED) {
      throw new BadRequestException('Only QUOTED requests can be accepted or rejected');
    }

    const updated = await this.bookingsRepository.updateCustomRequest(requestId, { status: dto.status });

    if (dto.status === CustomRequestStatus.ACCEPTED && request.quotedPrice) {
      const currentTotal = Number(booking.totalAmount);
      await this.bookingsRepository.update(booking.id, {
        totalAmount: currentTotal + Number(request.quotedPrice),
      });
    }

    return updated;
  }

  // ── Collaborators ──────────────────────────────────────────────────────────

  getBookingCollaborators(bookingId: string) {
    return this.bookingsRepository.findCollaboratorsByBooking(bookingId);
  }

  getMyCollaboratorInvites(collaboratorVendorId: string) {
    return this.bookingsRepository.findCollaboratorInvites(collaboratorVendorId);
  }

  async inviteCollaborator(bookingId: string, user: User, dto: InviteCollaboratorDto) {
    const booking = await this.bookingsRepository.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.vendor?.userId !== user.id) {
      throw new ForbiddenException('Only the primary vendor can invite collaborators');
    }
    if (dto.collaboratorVendorId === booking.vendorId) {
      throw new BadRequestException('Cannot invite yourself as a collaborator');
    }

    return this.bookingsRepository.saveCollaborator({
      bookingId,
      primaryVendorId: booking.vendorId,
      collaboratorVendorId: dto.collaboratorVendorId,
      role: dto.role,
      agreedFee: dto.agreedFee,
      notes: dto.notes,
      status: CollaboratorStatus.INVITED,
    });
  }

  async respondToCollaboratorInvite(collaboratorId: string, user: User, dto: RespondCollaboratorDto) {
    const collab = await this.bookingsRepository.findCollaboratorById(collaboratorId);
    if (!collab) throw new NotFoundException('Collaborator invite not found');
    if (collab.collaboratorVendor?.user?.id !== user.id) {
      throw new ForbiddenException('Only the invited vendor can respond to this invite');
    }
    if (collab.status !== CollaboratorStatus.INVITED) {
      throw new BadRequestException('This invite has already been responded to');
    }

    return this.bookingsRepository.updateCollaborator(collaboratorId, {
      status: dto.status,
      respondedAt: new Date(),
    });
  }

  async cancelCollaborator(collaboratorId: string, user: User) {
    const collab = await this.bookingsRepository.findCollaboratorById(collaboratorId);
    if (!collab) throw new NotFoundException('Collaborator not found');

    const booking = await this.bookingsRepository.findById(collab.bookingId);
    if (booking.vendor?.userId !== user.id) {
      throw new ForbiddenException('Only the primary vendor can cancel a collaborator');
    }
    if (collab.status === CollaboratorStatus.CANCELLED) {
      throw new BadRequestException('Already cancelled');
    }

    return this.bookingsRepository.updateCollaborator(collaboratorId, {
      status: CollaboratorStatus.CANCELLED,
      respondedAt: new Date(),
    });
  }
}
