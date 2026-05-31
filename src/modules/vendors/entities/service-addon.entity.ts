import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../shared/base.entity';
import { Vendor } from './vendor.entity';
import { AddonCategory } from '../../../common/enums/addon-category.enum';

@Entity('service_addons')
export class ServiceAddon extends BaseEntity {
  @Index()
  @Column({ name: 'vendor_id' })
  vendorId: string;

  @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @ApiProperty({ example: 'Drone (DJI Mavic 3 Pro)' })
  @Column()
  name: string;

  @ApiProperty({ example: 'Aerial shots at ceremony and reception', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ enum: AddonCategory })
  @Column({ type: 'enum', enum: AddonCategory, default: AddonCategory.OTHER })
  category: AddonCategory;

  @ApiProperty({ example: 5000 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ example: 1, description: 'Max quantity a customer can select' })
  @Column({ name: 'max_quantity', default: 1 })
  maxQuantity: number;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
