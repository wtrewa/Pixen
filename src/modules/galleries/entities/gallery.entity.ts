import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../shared/base.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { GalleryMedia } from './gallery-media.entity';

@Entity('galleries')
export class Gallery extends BaseEntity {
  @Index()
  @Column({ name: 'vendor_id' })
  vendorId: string;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Index()
  @Column({ name: 'booking_id' })
  bookingId: string;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'cover_image_url', nullable: true })
  coverImageUrl: string;

  @Column({ name: 'password_hash', nullable: true, select: false })
  passwordHash: string;

  @Column({ name: 'qr_code_url', nullable: true })
  qrCodeUrl: string;

  @Column({ name: 'is_watermarked', default: true })
  isWatermarked: boolean;

  @OneToMany(() => GalleryMedia, (media) => media.gallery)
  media: GalleryMedia[];
}
