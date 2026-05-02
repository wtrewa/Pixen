import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { RazorpayProvider } from './providers/razorpay.provider';
import { CashfreeProvider } from './providers/cashfree.provider';
import { Payment } from './entities/payment.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Booking])],
  controllers: [PaymentsController],
  providers: [PaymentsService, RazorpayProvider, CashfreeProvider],
  exports: [PaymentsService, CashfreeProvider],
})
export class PaymentsModule {}
