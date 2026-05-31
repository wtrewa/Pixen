import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../shared/base.entity';
import { Booking } from './booking.entity';
import { CustomRequestStatus } from '../../../common/enums/custom-request-status.enum';

@Entity('booking_custom_requests')
export class BookingCustomRequest extends BaseEntity {
  @Index()
  @Column({ name: 'booking_id' })
  bookingId: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ApiProperty({ example: 'I also want a smoke machine and confetti cannon for the ceremony' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ example: 'We can arrange this via rental', required: false })
  @Column({ name: 'vendor_response', type: 'text', nullable: true })
  vendorResponse: string;

  @ApiProperty({ example: 2500, required: false })
  @Column({ name: 'quoted_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  quotedPrice: number;

  @ApiProperty({ enum: CustomRequestStatus, default: CustomRequestStatus.PENDING })
  @Column({
    type: 'enum',
    enum: CustomRequestStatus,
    default: CustomRequestStatus.PENDING,
  })
  status: CustomRequestStatus;
}
