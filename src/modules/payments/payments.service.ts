import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { RazorpayProvider } from './providers/razorpay.provider';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import {
  PaymentStatus,
  PaymentGateway,
} from '../../common/enums/payment-status.enum';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { Request } from 'express';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    private readonly razorpay: RazorpayProvider,
  ) {}

  async initiate(userId: string, dto: InitiatePaymentDto) {
    const booking = await this.bookingRepo.findOne({ where: { id: dto.bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== userId) throw new UnauthorizedException();

    let amount = dto.type === 'ADVANCE' ? booking.advanceAmount : booking.totalAmount - booking.advanceAmount;
    
    // Safety check for testing: Razorpay doesn't allow 0 amount
    if (amount <= 0 && !this.razorpay['client']) {
      amount = 500; // Mock amount for testing if no real client
    }

    const order = await this.razorpay.createOrder(amount, 'INR', booking.id);

    const payment = await this.paymentRepo.save(
      this.paymentRepo.create({
        bookingId: booking.id,
        amount,
        type: dto.type,
        gateway: PaymentGateway.RAZORPAY,
        gatewayOrderId: (order as any).id,
      }),
    );

    return { message: 'Payment order created', data: { payment, order } };
  }

  async verify(dto: VerifyPaymentDto) {
    const isValid = this.razorpay.verifyPaymentSignature(
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );
    if (!isValid) throw new BadRequestException('Payment verification failed');

    const payment = await this.paymentRepo.findOne({
      where: { gatewayOrderId: dto.razorpayOrderId },
    });
    if (!payment) throw new NotFoundException('Payment record not found');

    await this.paymentRepo.update(payment.id, {
      status: PaymentStatus.SUCCESS,
      gatewayPaymentId: dto.razorpayPaymentId,
      gatewaySignature: dto.razorpaySignature,
    });

    // Update Booking status to CONFIRMED
    await this.bookingRepo.update(payment.bookingId, {
      status: BookingStatus.CONFIRMED,
    });

    return { message: 'Payment verified', data: { paymentId: payment.id } };
  }

  async handleWebhook(req: Request) {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    const isValid = this.razorpay.verifyWebhookSignature(rawBody, signature);
    if (!isValid) throw new UnauthorizedException('Invalid webhook signature');

    const event = req.body?.event;
    if (event === 'payment.captured') {
      const orderId = req.body?.payload?.payment?.entity?.order_id;
      const payment = await this.paymentRepo.findOne({ where: { gatewayOrderId: orderId } });
      if (payment) {
        await this.paymentRepo.update(payment.id, { status: PaymentStatus.SUCCESS });
        await this.bookingRepo.update(payment.bookingId, { status: BookingStatus.CONFIRMED });
      }
    }

    return { received: true };
  }

  findByBooking(bookingId: string) {
    return this.paymentRepo.find({ where: { bookingId } });
  }
}
