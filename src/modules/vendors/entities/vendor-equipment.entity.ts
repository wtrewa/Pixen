import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../shared/base.entity';
import { Vendor } from './vendor.entity';
import { EquipmentCategory } from '../../../common/enums/equipment-category.enum';

@Entity('vendor_equipment')
export class VendorEquipment extends BaseEntity {
  @Index()
  @Column({ name: 'vendor_id' })
  vendorId: string;

  @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @ApiProperty({ example: 'Sony A7S III' })
  @Column()
  name: string;

  @ApiProperty({ example: 'Sony', required: false })
  @Column({ nullable: true })
  brand: string;

  @ApiProperty({ example: 'A7S III', required: false })
  @Column({ nullable: true })
  model: string;

  @ApiProperty({ enum: EquipmentCategory })
  @Column({ type: 'enum', enum: EquipmentCategory, default: EquipmentCategory.OTHER })
  category: EquipmentCategory;

  @ApiProperty({ example: 2, description: 'Number of units owned' })
  @Column({ default: 1 })
  quantity: number;

  @ApiProperty({ example: '4K 120fps, excellent low-light', required: false })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ example: true, description: 'Whether this gear is available to offer in bookings' })
  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;
}
