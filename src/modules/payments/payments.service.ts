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
  PaymentType,
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
    try {
      const booking = await this.bookingRepo.findOne({
        where: { id: dto.bookingId },
        relations: ['customer']
      });
      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.customerId !== userId) throw new UnauthorizedException();

      // Enforce booking status guards
      if (dto.type === PaymentType.ADVANCE && booking.status !== BookingStatus.CONFIRMED) {
        throw new BadRequestException('Advance payment can only be initiated after the vendor confirms the booking.');
      }
      
      // ALLOW early final payment if advance is paid
      const allowedForFinal = [BookingStatus.ADVANCE_PAID, BookingStatus.SHOOT_COMPLETED, BookingStatus.DELIVERED];
      if (dto.type === PaymentType.FINAL && !allowedForFinal.includes(booking.status)) {
        throw new BadRequestException('Final payment can only be initiated after the advance payment is completed.');
      }

      // Double-pay guard + Auto-repair
      const alreadyPaid = await this.paymentRepo.findOne({
        where: { bookingId: dto.bookingId, type: dto.type, status: PaymentStatus.SUCCESS },
      });

      if (alreadyPaid) {
        // IDEMPOTENCY: If DB says success but booking status or isFinalPaid is stale, repair it now
        await this.handleSuccessfulPayment(dto.bookingId, alreadyPaid);
        throw new BadRequestException(`${dto.type} payment has already been completed for this booking.`);
      }

      let amount = dto.type === PaymentType.ADVANCE
        ? Number(booking.advanceAmount)
        : Number(booking.totalAmount) - Number(booking.advanceAmount);

      if (amount <= 0) {
        throw new BadRequestException(`Invalid payment amount: ${amount}. Please check the booking details.`);
      }

      const gateway = this.config.get<string>('payment.gateway');

      if (gateway === 'RAZORPAY') {
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
        const orderData = {
          orderId: `ORDER_${booking.id.substring(0, 8)}_${Date.now()}`,
          amount,
          currency: 'INR',
          customerId: booking.customerId,
          customerName: booking.customer?.fullName || 'Customer',
          customerPhone: booking.customer?.phone || '9999999999',
          customerEmail: booking.customer?.email || 'customer@pixen.in',
          returnUrl: `${this.config.get('FRONTEND_URL')}/payments/${booking.id}?payment_id={order_id}`,
        };

        const order = await this.cashfree.createOrder(orderData);
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
            order: { ...order, paymentSessionId: order.payment_session_id } 
          } 
        };
      }
    } catch (error) {
      this.logger.error(`Payment Initiation Failed: ${error.message}`);
      throw error;
    }
  }

  async verify(dto: VerifyPaymentDto) {
    let paymentId: string;
    let bookingId: string;

    if (dto.cashfreeOrderId) {
      const orderPayments = await this.cashfree.getOrder(dto.cashfreeOrderId);
      const lastPayment = orderPayments?.[0];
      
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
      
      paymentId = payment.id;
      bookingId = payment.bookingId;
      await this.handleSuccessfulPayment(bookingId, { ...payment, status: PaymentStatus.SUCCESS });
    } else if (dto.razorpayOrderId && dto.razorpayPaymentId && dto.razorpaySignature) {
      const isValid = this.razorpay.verifyPaymentSignature(dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature);
      if (!isValid) throw new BadRequestException('Payment verification failed');

      const payment = await this.paymentRepo.findOne({ where: { gatewayOrderId: dto.razorpayOrderId } });
      if (!payment) throw new NotFoundException('Payment record not found');

      await this.paymentRepo.update(payment.id, {
        status: PaymentStatus.SUCCESS,
        gatewayPaymentId: dto.razorpayPaymentId,
        gatewaySignature: dto.razorpaySignature,
      });

      paymentId = payment.id;
      bookingId = payment.bookingId;
      await this.handleSuccessfulPayment(bookingId, { ...payment, status: PaymentStatus.SUCCESS });
    } else {
      throw new BadRequestException('Invalid verification data');
    }

    return { message: 'Payment verified', data: { paymentId } };
  }

  async handleWebhook(req: Request) {
    const rzpSignature = req.headers['x-razorpay-signature'] as string;
    if (rzpSignature) {
      const rawBody = JSON.stringify(req.body);
      if (this.razorpay.verifyWebhookSignature(rawBody, rzpSignature)) {
        const event = req.body?.event;
        if (event === 'payment.captured') {
          const orderId = req.body?.payload?.payment?.entity?.order_id;
          const payment = await this.paymentRepo.findOne({ where: { gatewayOrderId: orderId } });
          if (payment) {
            await this.paymentRepo.update(payment.id, { status: PaymentStatus.SUCCESS });
            await this.handleSuccessfulPayment(payment.bookingId, { ...payment, status: PaymentStatus.SUCCESS });
          }
        }
        return { received: true };
      }
    }

    const cfSignature = req.headers['x-webhook-signature'] as string;
    const cfTimestamp = req.headers['x-webhook-timestamp'] as string;
    if (cfSignature && cfTimestamp) {
      try {
        this.cashfree.verifyWebhook(cfSignature, JSON.stringify(req.body), cfTimestamp);
        const { order, payment } = req.body.data;
        if (payment.payment_status === 'SUCCESS') {
          const paymentRecord = await this.paymentRepo.findOne({ where: { gatewayOrderId: order.order_id } });
          if (paymentRecord) {
            await this.paymentRepo.update(paymentRecord.id, { 
              status: PaymentStatus.SUCCESS,
              gatewayPaymentId: payment.cf_payment_id.toString()
            });
            await this.handleSuccessfulPayment(paymentRecord.bookingId, { ...paymentRecord, status: PaymentStatus.SUCCESS });
          }
        }
      } catch (err) {
        this.logger.error('Cashfree Webhook Failed:', err.message);
      }
      return { received: true };
    }

    return { received: false };
  }

  private async handleSuccessfulPayment(bookingId: string, payment: Payment) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) return;

    const targetStatus = payment.type === PaymentType.ADVANCE 
      ? BookingStatus.ADVANCE_PAID 
      : BookingStatus.COMPLETED;

    const isFinalPayment = payment.type === PaymentType.FINAL;
    const shouldUpdateStatus = 
      (payment.type === PaymentType.ADVANCE && booking.status === BookingStatus.CONFIRMED) ||
      (isFinalPayment && booking.status === BookingStatus.DELIVERED);

    const updateData: Partial<Booking> = {};
    if (shouldUpdateStatus) updateData.status = targetStatus;
    if (isFinalPayment && !booking.isFinalPaid) updateData.isFinalPaid = true;

    if (Object.keys(updateData).length > 0) {
      await this.bookingRepo.update(bookingId, updateData);
      this.logger.log(`Booking ${bookingId} synchronized: ${JSON.stringify(updateData)}`);
    }
  }

  findByBooking(bookingId: string) {
    return this.paymentRepo.find({ where: { bookingId } });
  }
}
