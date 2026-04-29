import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { GalleriesService } from './galleries.service';
import { GalleriesController } from './galleries.controller';
import { Gallery } from './entities/gallery.entity';
import { GalleryMedia } from './entities/gallery-media.entity';
import { StorageModule } from '../../infrastructure/storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Gallery, GalleryMedia]),
    JwtModule.register({}),
    StorageModule,
  ],
  controllers: [GalleriesController],
  providers: [GalleriesService],
  exports: [GalleriesService],
})
export class GalleriesModule {}
