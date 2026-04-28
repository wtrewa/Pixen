import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Payment } from '../payments/entities/payment.entity';
import { AuditLog } from './entities/audit-log.entity';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { Review } from '../reviews/entities/review.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Vendor) private readonly vendorRepo: Repository<Vendor>,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
  ) {}

  async getDashboardStats() {
    const [totalUsers, totalVendors, totalBookings, revenueResult, recentBookings, recentReviews] = await Promise.all([
      this.userRepo.count(),
      this.vendorRepo.count(),
      this.bookingRepo.count(),
      this.paymentRepo
        .createQueryBuilder('p')
        .select('SUM(p.amount)', 'total')
        .where('p.status = :status', { status: PaymentStatus.SUCCESS })
        .getRawOne(),
      this.bookingRepo.find({
        order: { createdAt: 'DESC' },
        take: 5,
        relations: ['customer', 'vendor'],
      }),
      this.reviewRepo.find({
        order: { createdAt: 'DESC' },
        take: 5,
        relations: ['customer', 'vendor', 'booking'],
      }),
    ]);

    const bookingsByStatus = await this.bookingRepo
      .createQueryBuilder('b')
      .select('b.status', 'status')
      .addSelect('COUNT(b.id)', 'count')
      .groupBy('b.status')
      .getRawMany();

    return {
      totalUsers,
      totalVendors,
      totalBookings,
      totalRevenue: parseFloat(revenueResult?.total) || 0,
      bookingsByStatus,
      recentBookings,
      recentReviews,
    };
  }

  async logAudit(payload: Partial<AuditLog>) {
    return this.auditRepo.save(this.auditRepo.create(payload));
  }

  async getAuditLogs(page = 1, limit = 20) {
    const [data, total] = await this.auditRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['admin'],
    });
    return { data, total, page, limit };
  }

  async toggleUserStatus(userId: string, adminId: string, ip: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const before = { isActive: user.isActive };
    await this.userRepo.update(userId, { isActive: !user.isActive });
    await this.logAudit({
      adminId,
      action: 'TOGGLE_USER_STATUS',
      entity: 'User',
      entityId: userId,
      before,
      after: { isActive: !user.isActive },
      ip,
    });
    return { message: `User ${user.isActive ? 'deactivated' : 'activated'}` };
  }

  async deleteUser(userId: string, adminId: string, ip: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepo.delete(userId);
    await this.logAudit({
      adminId,
      action: 'DELETE_USER',
      entity: 'User',
      entityId: userId,
      before: user,
      after: null,
      ip,
    });
    return { message: 'User permanently deleted' };
  }

  async deleteVendor(vendorId: string, adminId: string, ip: string) {
    const vendor = await this.vendorRepo.findOne({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    await this.vendorRepo.delete(vendorId);
    await this.logAudit({
      adminId,
      action: 'DELETE_VENDOR',
      entity: 'Vendor',
      entityId: vendorId,
      before: vendor,
      after: null,
      ip,
    });
    return { message: 'Vendor profile deleted' };
  }

  async getVendorEarnings(vendorId: string) {
    const payments = await this.paymentRepo.find({
      where: { 
        booking: { vendorId: vendorId },
        status: PaymentStatus.SUCCESS 
      },
      relations: ['booking'],
    });

    const totalEarning = payments.reduce((acc, p) => acc + Number(p.amount), 0);
    return { vendorId, totalEarning, transactions: payments };
  }

  async deleteReview(reviewId: string, adminId: string, ip: string) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    await this.reviewRepo.delete(reviewId);
    await this.logAudit({
      adminId,
      action: 'DELETE_REVIEW',
      entity: 'Review',
      entityId: reviewId,
      before: review,
      after: null,
      ip,
    });
    return { message: 'Review removed by administrator' };
  }
}
