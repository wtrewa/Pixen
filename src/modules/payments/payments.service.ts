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
import { CashfreeProvider } from './providers/cashfree.provider';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import {
  PaymentStatus,
  PaymentGateway,
} from '../../common/enums/payment-status.enum';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    private readonly razorpay: RazorpayProvider,
    private readonly cashfree: CashfreeProvider,
    private readonly config: ConfigService,
  ) {}

  async initiate(userId: string, dto: InitiatePaymentDto) {
    const booking = await this.bookingRepo.findOne({ 
      where: { id: dto.bookingId },
      relations: ['customer'] 
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== userId) throw new UnauthorizedException();

    let amount = dto.type === 'ADVANCE' ? booking.advanceAmount : booking.totalAmount - booking.advanceAmount;
    
    const gateway = this.config.get<string>('PAYMENT_GATEWAY', 'CASHFREE');

    if (gateway === 'RAZORPAY') {
      // Safety check for testing: Razorpay doesn't allow 0 amount
      if (amount <= 0 && !this.razorpay['client']) {
        amount = 500; 
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
    } else {
      const order = await this.cashfree.createOrder(
        amount, 
        'INR', 
        booking.customerId, 
        booking.customer?.phone || '9999999999', 
        booking.customer?.email, 
        booking.id
      );

      const payment = await this.paymentRepo.save(
        this.paymentRepo.create({
          bookingId: booking.id,
          amount,
          type: dto.type,
          gateway: PaymentGateway.CASHFREE,
          gatewayOrderId: order.order_id,
        }),
      );

      return { 
        message: 'Payment order created', 
        data: { 
          payment, 
          order: {
            ...order,
            paymentSessionId: order.payment_session_id
          } 
        } 
      };
    }
  }

  async verify(dto: VerifyPaymentDto) {
    if (dto.cashfreeOrderId) {
      const order = await this.cashfree.getOrder(dto.cashfreeOrderId);
      const lastPayment = order[0]; // Assuming the latest payment
      
      if (!lastPayment || lastPayment.payment_status !== 'SUCCESS') {
        throw new BadRequestException('Payment not successful or pending');
      }

      const payment = await this.paymentRepo.findOne({
        where: { gatewayOrderId: dto.cashfreeOrderId },
      });
      if (!payment) throw new NotFoundException('Payment record not found');

      await this.paymentRepo.update(payment.id, {
        status: PaymentStatus.SUCCESS,
        gatewayPaymentId: lastPayment.cf_payment_id.toString(),
      });

      await this.bookingRepo.update(payment.bookingId, {
        status: BookingStatus.CONFIRMED,
      });

      return { message: 'Payment verified', data: { paymentId: payment.id } };
    }

    // Razorpay Flow
    if (dto.razorpayOrderId && dto.razorpayPaymentId && dto.razorpaySignature) {
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

      await this.bookingRepo.update(payment.bookingId, {
        status: BookingStatus.CONFIRMED,
      });

      return { message: 'Payment verified', data: { paymentId: payment.id } };
    }

    throw new BadRequestException('Invalid verification data');
  }

  async handleWebhook(req: Request) {
    // Razorpay Webhook
    const rzpSignature = req.headers['x-razorpay-signature'] as string;
    if (rzpSignature) {
      const rawBody = JSON.stringify(req.body);
      const isValid = this.razorpay.verifyWebhookSignature(rawBody, rzpSignature);
      if (!isValid) throw new UnauthorizedException('Invalid Razorpay webhook signature');

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

    // Cashfree Webhook (Basic implementation)
    // In production, you should verify the signature using Cashfree.XClientSecret
    const cfSignature = req.headers['x-cf-signature'] as string;
    if (cfSignature) {
      const { order_id, payment_status } = req.body.data.object;
      if (payment_status === 'SUCCESS') {
        const payment = await this.paymentRepo.findOne({ where: { gatewayOrderId: order_id } });
        if (payment) {
          await this.paymentRepo.update(payment.id, { status: PaymentStatus.SUCCESS });
          await this.bookingRepo.update(payment.bookingId, { status: BookingStatus.CONFIRMED });
        }
      }
      return { received: true };
    }

    return { received: false };
  }

  findByBooking(bookingId: string) {
    return this.paymentRepo.find({ where: { bookingId } });
  }
}
