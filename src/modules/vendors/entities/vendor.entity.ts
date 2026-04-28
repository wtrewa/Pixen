import { Entity, Column, OneToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../shared/base.entity';
import { User } from '../../users/entities/user.entity';
import { VendorService } from './vendor-service.entity';
import { Portfolio } from '../../portfolios/entities/portfolio.entity';
import { VendorAvailability } from './vendor-availability.entity';

@Entity('vendors')
export class Vendor extends BaseEntity {
  @ApiProperty({ example: 'uuid-v4-user-id' })
  @Column({ name: 'user_id' })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ example: 'The Wedding Frame' })
  @Column({ name: 'business_name' })
  businessName: string;

  @ApiProperty({ example: 'Luxury wedding photography and cinematography service.', required: false })
  @Column({ name: 'business_description', type: 'text', nullable: true })
  businessDescription: string;

  @ApiProperty({ example: 'Photographer', description: 'Industry category' })
  @Index()
  @Column({ nullable: true })
  category: string;

  @ApiProperty({ example: 'Mumbai' })
  @Index()
  @Column({ nullable: true })
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  @Column({ nullable: true })
  state: string;

  @ApiProperty({ example: 'India' })
  @Column({ nullable: true })
  country: string;

  @ApiProperty({ example: '123, Marine Drive, Mumbai', required: false })
  @Column({ nullable: true })
  address: string;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @ApiProperty({ example: 4.5 })
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @ApiProperty({ example: 120 })
  @Column({ name: 'total_reviews', default: 0 })
  totalReviews: number;

  @ApiProperty({ example: 3, description: 'Number of teams available for booking' })
  @Column({ name: 'team_count', default: 1 })
  teamCount: number;

  @OneToMany(() => VendorService, (s) => s.vendor, { cascade: true })
  services: VendorService[];

  @OneToMany(() => Portfolio, (p) => p.vendor)
  portfolios: Portfolio[];

  @OneToMany(() => VendorAvailability, (a) => a.vendor)
  availability: VendorAvailability[];
}
