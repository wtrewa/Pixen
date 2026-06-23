import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../shared/base.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import {
  PaymentStatus,
  PaymentType,
  PaymentGateway,
} from '../../../common/enums/payment-status.enum';

@Entity('payments')
export class Payment extends BaseEntity {
  @Index()
  @Column({ name: 'booking_id' })
  bookingId: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'INR' })
  currency: string;

  @Index()
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentGateway, default: PaymentGateway.RAZORPAY })
  gateway: PaymentGateway;

  @Column({ name: 'gateway_order_id', nullable: true })
  gatewayOrderId: string;

  @Column({ name: 'gateway_payment_id', nullable: true })
  gatewayPaymentId: string;

  @Column({ name: 'gateway_signature', nullable: true })
  gatewaySignature: string;

  @Column({ type: 'enum', enum: PaymentType, default: PaymentType.ADVANCE })
  type: PaymentType;

  @Column({ name: 'invoice_url', nullable: true })
  invoiceUrl: string;

  @Column({ name: 'refund_id', nullable: true })
  refundId: string;

  @Column({ name: 'refund_reason', nullable: true })
  refundReason: string;

  @Column({ name: 'refunded_at', type: 'timestamptz', nullable: true })
  refundedAt: Date;
}
