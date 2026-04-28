import { Entity, Column, ManyToOne, JoinColumn, OneToOne, Index, Check } from 'typeorm';
import { BaseEntity } from '../../../shared/base.entity';
import { User } from '../../users/entities/user.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('reviews')
@Check('"rating" >= 1 AND "rating" <= 5')
export class Review extends BaseEntity {
  @OneToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'booking_id', unique: true })
  bookingId: string;

  @Index()
  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Index()
  @Column({ name: 'vendor_id' })
  vendorId: string;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ name: 'is_published', default: true })
  isPublished: boolean;
}
