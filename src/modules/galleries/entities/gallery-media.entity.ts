import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../shared/base.entity';
import { Gallery } from './gallery.entity';

export enum MediaType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
}

@Entity('gallery_media')
export class GalleryMedia extends BaseEntity {
  @Index()
  @Column({ name: 'gallery_id' })
  galleryId: string;

  @ManyToOne(() => Gallery, (gallery) => gallery.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gallery_id' })
  gallery: Gallery;

  @Column({ type: 'enum', enum: MediaType, default: MediaType.PHOTO })
  type: MediaType;

  @Column({ name: 'original_url' })
  originalUrl: string;

  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl: string;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ nullable: true })
  width: number;

  @Column({ nullable: true })
  height: number;
}
