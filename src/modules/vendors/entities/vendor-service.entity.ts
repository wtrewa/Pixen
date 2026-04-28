import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../shared/base.entity';
import { Vendor } from './vendor.entity';

@Entity('vendor_services')
export class VendorService extends BaseEntity {
  @Index()
  @Column({ name: 'vendor_id' })
  vendorId: string;

  @ManyToOne(() => Vendor, (v) => v.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  duration: number;

  @Column({ type: 'enum', enum: ['SILVER', 'GOLD', 'PLATINUM', 'CUSTOM'], default: 'CUSTOM' })
  tier: string;

  @Column({ type: 'jsonb', default: [] })
  features: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
