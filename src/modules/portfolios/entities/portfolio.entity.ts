import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/base.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { PortfolioMedia } from './portfolio-media.entity';

@Entity('portfolios')
export class Portfolio extends BaseEntity {
  @Column({ name: 'vendor_id' })
  vendorId: string;

  @ManyToOne(() => Vendor, (v) => v.portfolios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => PortfolioMedia, (m) => m.portfolio, { cascade: true })
  media: PortfolioMedia[];
}
