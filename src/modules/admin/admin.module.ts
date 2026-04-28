import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditLog } from './entities/audit-log.entity';
import { User } from '../users/entities/user.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Review } from '../reviews/entities/review.entity';
import { VendorsModule } from '../vendors/vendors.module';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, User, Vendor, Booking, Payment, Review]), VendorsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
