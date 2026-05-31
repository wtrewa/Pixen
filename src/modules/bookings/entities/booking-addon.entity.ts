import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../shared/base.entity';
import { Booking } from './booking.entity';
import { ServiceAddon } from '../../vendors/entities/service-addon.entity';

@Entity('booking_addons')
export class BookingAddon extends BaseEntity {
  @Index()
  @Column({ name: 'booking_id' })
  bookingId: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'addon_id' })
  addonId: string;

  @ManyToOne(() => ServiceAddon)
  @JoinColumn({ name: 'addon_id' })
  addon: ServiceAddon;

  @ApiProperty({ example: 1 })
  @Column({ default: 1 })
  quantity: number;

  @ApiProperty({ example: 5000, description: 'Price frozen at booking time' })
  @Column({ name: 'price_snapshot', type: 'decimal', precision: 10, scale: 2 })
  priceSnapshot: number;
}
