import { Entity, Column, ManyToOne, JoinColumn, OneToOne, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../shared/base.entity';
import { User } from '../../users/entities/user.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { VendorService } from '../../vendors/entities/vendor-service.entity';
import { BookingStatus } from '../../../common/enums/booking-status.enum';

@Entity('bookings')
export class Booking extends BaseEntity {
  @Index()
  @ApiProperty({ example: 'uuid-v4-customer-id' })
  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Index()
  @ApiProperty({ example: 'uuid-v4-vendor-id' })
  @Column({ name: 'vendor_id' })
  vendorId: string;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @ApiProperty({ example: 'uuid-v4-service-id' })
  @Column({ name: 'service_id' })
  serviceId: string;

  @ManyToOne(() => VendorService)
  @JoinColumn({ name: 'service_id' })
  service: VendorService;

  @Index()
  @ApiProperty({ enum: BookingStatus, default: BookingStatus.PENDING })
  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @ApiProperty({ example: '2026-12-15T10:00:00Z' })
  @Column({ name: 'event_date', type: 'timestamptz' })
  eventDate: Date;

  @ApiProperty({ example: 'Grand Palace, Mumbai' })
  @Column({ name: 'event_location', nullable: true })
  eventLocation: string;

  @ApiProperty({ example: 50000 })
  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @ApiProperty({ example: 10000 })
  @Column({ name: 'advance_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  advanceAmount: number;

  @ApiProperty({ example: 'Deliver high-res files in 30 days', required: false })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ example: 'Customer moved abroad', required: false })
  @Column({ name: 'cancellation_reason', nullable: true })
  cancellationReason: string;

  // Professional Handover Fields
  @ApiProperty({ example: '2026-12-15T22:00:00Z', required: false })
  @Column({ name: 'shoot_completed_at', type: 'timestamptz', nullable: true })
  shootCompletedAt: Date;

  @ApiProperty({ example: 'https://pixen.gallery/wedding-123', required: false })
  @Column({ name: 'delivery_link', nullable: true })
  deliveryLink: string;

  @ApiProperty({ example: '2027-01-10T14:00:00Z', required: false })
  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date;

  @ApiProperty({ example: '2026-12-15T22:00:00Z', description: 'Scheduled end time including buffer' })
  @Column({ name: 'end_at', type: 'timestamptz', nullable: true })
  endAt: Date;

  @ApiProperty({ example: 0, description: 'Index of the team assigned (0 to teamCount-1)' })
  @Column({ name: 'team_index', default: 0 })
  teamIndex: number;

  @ApiProperty({ example: false, description: 'Whether the final balance has been paid' })
  @Column({ name: 'is_final_paid', default: false })
  isFinalPaid: boolean;
}
