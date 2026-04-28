import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../shared/base.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';

export enum PostType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

@Entity('posts')
export class Post extends BaseEntity {
  @ApiProperty({ example: 'uuid-v4-vendor-id' })
  @Column({ name: 'vendor_id' })
  vendorId: string;

  @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @ApiProperty({ enum: PostType, example: 'VIDEO' })
  @Column({ type: 'enum', enum: PostType, default: PostType.IMAGE })
  type: PostType;

  @ApiProperty({ example: 'https://cdn.pixabay.com/video/example.mp4' })
  @Column()
  url: string;

  @ApiProperty({ example: 'Traditional Telugu Wedding Ceremony', required: false })
  @Column({ type: 'text', nullable: true })
  caption: string;

  @ApiProperty({ example: 'Indian Wedding', required: false })
  @Column({ type: 'text', nullable: true })
  category: string;

  @ApiProperty({ example: 1250 })
  @Column({ name: 'likes_count', default: 0 })
  likesCount: number;

  @ApiProperty({ example: 5400 })
  @Column({ name: 'views_count', default: 0 })
  viewsCount: number;
}
