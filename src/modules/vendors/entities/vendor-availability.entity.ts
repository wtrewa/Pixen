import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Vendor } from './vendor.entity';

@Entity('vendor_availabilities')
@Index(['vendor', 'date'], { unique: true })
export class VendorAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Vendor, (vendor) => vendor.availability, { onDelete: 'CASCADE' })
  vendor: Vendor;

  @Column({ name: 'vendor_id' })
  vendorId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'boolean', default: true })
  isBlocked: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string;

  @Column({ type: 'varchar', length: 50, default: 'MANUAL' })
  source: string; // MANUAL, GOOGLE_CALENDAR

  @Column({ name: 'external_event_id', type: 'varchar', length: 255, nullable: true })
  externalEventId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
