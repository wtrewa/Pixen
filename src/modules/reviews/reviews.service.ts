import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { paginate, buildPaginatedResult } from '../../common/utils/pagination.util';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Vendor) private readonly vendorRepo: Repository<Vendor>,
  ) {}

  async create(customerId: string, dto: CreateReviewDto) {
    const booking = await this.bookingRepo.findOne({ where: { id: dto.bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== customerId) throw new ForbiddenException();
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new ForbiddenException('Can only review completed bookings');
    }

    const exists = await this.reviewRepo.findOne({ where: { bookingId: dto.bookingId } });
    if (exists) throw new ConflictException('Review already submitted for this booking');

    const review = await this.reviewRepo.save(
      this.reviewRepo.create({
        ...dto,
        customerId,
        vendorId: booking.vendorId,
      }),
    );

    await this.recalculateVendorRating(booking.vendorId);
    return { message: 'Review submitted', data: review };
  }

  async findByVendor(vendorId: string, page = 1, limit = 10) {
    const { skip, take } = paginate(page, limit);
    const [data, total] = await this.reviewRepo.findAndCount({
      where: { vendorId, isPublished: true },
      skip,
      take,
      relations: ['customer'],
    });
    return buildPaginatedResult(data, total, page, limit);
  }

  async remove(id: string, adminId: string) {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    await this.reviewRepo.softDelete(id);
    await this.recalculateVendorRating(review.vendorId);
  }

  private async recalculateVendorRating(vendorId: string) {
    const { avg, count } = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.vendor_id = :vendorId', { vendorId })
      .andWhere('r.is_published = true')
      .getRawOne();

    await this.vendorRepo.update(vendorId, {
      rating: parseFloat(avg) || 0,
      totalReviews: parseInt(count) || 0,
    });
  }
}
