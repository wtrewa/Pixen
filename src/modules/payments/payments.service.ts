import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
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
  private readonly logger = new Logger(PaymentsService.name);

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
      const order = await this.cashfree.createOrder({
        orderId: `ORDER_${booking.id}_${Date.now()}`,
        amount,
        currency: 'INR',
        customerId: booking.customerId,
        customerName: booking.customer?.fullName || 'Customer',
        customerPhone: booking.customer?.phone || '9999999999',
        customerEmail: booking.customer?.email || '',
        returnUrl: `${this.config.get('FRONTEND_URL')}/payments/${booking.id}?payment_id={order_id}`,
      });

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
      const orderPayments = await this.cashfree.getOrder(dto.cashfreeOrderId);
      const lastPayment = orderPayments?.[0]; // Latest payment
      
      if (!lastPayment || lastPayment.payment_status !== 'SUCCESS') {
        throw new BadRequestException('Payment not successful or pending');
      }

      const payment = await this.paymentRepo.findOne({
        where: { gatewayOrderId: dto.cashfreeOrderId },
      });
      if (!payment) throw new NotFoundException('Payment record not found');

      await this.paymentRepo.update(payment.id, {
        status: PaymentStatus.SUCCESS,
        gatewayPaymentId: lastPayment.cf_payment_id?.toString(),
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

    // Cashfree Webhook
    const cfSignature = req.headers['x-webhook-signature'] as string;
    const cfTimestamp = req.headers['x-webhook-timestamp'] as string;
    
    if (cfSignature && cfTimestamp) {
      try {
        const rawBody = JSON.stringify(req.body);
        this.cashfree.verifyWebhook(cfSignature, rawBody, cfTimestamp);
        
        const { order, payment } = req.body.data;
        if (payment.payment_status === 'SUCCESS') {
          const paymentRecord = await this.paymentRepo.findOne({ 
            where: { gatewayOrderId: order.order_id } 
          });
          if (paymentRecord) {
            await this.paymentRepo.update(paymentRecord.id, { 
              status: PaymentStatus.SUCCESS,
              gatewayPaymentId: payment.cf_payment_id.toString()
            });
            await this.bookingRepo.update(paymentRecord.bookingId, { status: BookingStatus.CONFIRMED });
          }
        }
      } catch (err) {
        this.logger.error('Cashfree Webhook Verification Failed:', err.message);
        throw new UnauthorizedException('Invalid Cashfree webhook signature');
      }
      return { received: true };
    }

    return { received: false };
  }

  findByBooking(bookingId: string) {
    return this.paymentRepo.find({ where: { bookingId } });
  }
}
