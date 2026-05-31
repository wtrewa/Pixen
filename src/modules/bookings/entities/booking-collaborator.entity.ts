import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../shared/base.entity';
import { Booking } from './booking.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { CollaboratorStatus } from '../../../common/enums/collaborator-status.enum';

@Entity('booking_collaborators')
export class BookingCollaborator extends BaseEntity {
  @Index()
  @Column({ name: 'booking_id' })
  bookingId: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'primary_vendor_id' })
  primaryVendorId: string;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: 'primary_vendor_id' })
  primaryVendor: Vendor;

  @Column({ name: 'collaborator_vendor_id' })
  collaboratorVendorId: string;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: 'collaborator_vendor_id' })
  collaboratorVendor: Vendor;

  @ApiProperty({ example: 'Drone Operator' })
  @Column()
  role: string;

  @ApiProperty({ example: 'Handle aerial shots at ceremony and reception', required: false })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ example: 8000, description: 'Fee agreed between primary and collaborator vendor' })
  @Column({ name: 'agreed_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  agreedFee: number;

  @ApiProperty({ enum: CollaboratorStatus, default: CollaboratorStatus.INVITED })
  @Column({ type: 'enum', enum: CollaboratorStatus, default: CollaboratorStatus.INVITED })
  status: CollaboratorStatus;

  @ApiProperty({ required: false })
  @Column({ name: 'responded_at', type: 'timestamptz', nullable: true })
  respondedAt: Date;
}
