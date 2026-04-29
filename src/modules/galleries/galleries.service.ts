import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Gallery } from './entities/gallery.entity';
import { GalleryMedia, MediaType } from './entities/gallery-media.entity';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';

@Injectable()
export class GalleriesService {
  constructor(
    @InjectRepository(Gallery) private readonly galleryRepo: Repository<Gallery>,
    @InjectRepository(GalleryMedia) private readonly mediaRepo: Repository<GalleryMedia>,
    private readonly storageService: StorageService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async create(vendorId: string, dto: CreateGalleryDto) {
    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : null;
    
    const gallery = this.galleryRepo.create({
      ...dto,
      vendorId,
      passwordHash,
    });

    await this.galleryRepo.save(gallery);
    
    // Generate a temporary QR code URL placeholder or actual QR code logic here
    gallery.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://pixen.gallery/gallery/${gallery.id}`;
    await this.galleryRepo.save(gallery);

    return gallery;
  }

  async findOne(id: string) {
    const gallery = await this.galleryRepo.findOne({
      where: { id },
      relations: ['media'],
    });
    if (!gallery) throw new NotFoundException('Gallery not found');
    return gallery;
  }

  async validateAccess(id: string, password?: string) {
    const gallery = await this.galleryRepo.findOne({
      where: { id },
      select: ['id', 'passwordHash'],
    });
    if (!gallery) throw new NotFoundException('Gallery not found');

    if (gallery.passwordHash) {
      if (!password) throw new UnauthorizedException('Password required');
      const valid = await bcrypt.compare(password, gallery.passwordHash);
      if (!valid) throw new UnauthorizedException('Invalid password');
    }

    // Issue a temporary access token for this specific gallery
    const token = await this.jwtService.signAsync(
      { galleryId: id },
      {
        secret: this.config.get('jwt.accessSecret'),
        expiresIn: '2h',
      },
    );

    return { accessToken: token };
  }

  async getUploadUrls(vendorId: string, id: string, fileCount: number) {
    const gallery = await this.galleryRepo.findOne({ where: { id, vendorId } });
    if (!gallery) throw new ForbiddenException('Access denied');

    const urls = [];
    for (let i = 0; i < fileCount; i++) {
      const key = `galleries/${id}/${Date.now()}-${i}.jpg`;
      const uploadUrl = await this.storageService.getPresignedUrl(key);
      urls.push({ uploadUrl, key });
    }

    return urls;
  }

  async confirmUploads(vendorId: string, id: string, media: { key: string; type: MediaType }[]) {
    const gallery = await this.galleryRepo.findOne({ where: { id, vendorId } });
    if (!gallery) throw new ForbiddenException('Access denied');

    const entities = media.map((m) =>
      this.mediaRepo.create({
        galleryId: id,
        type: m.type,
        originalUrl: `https://${this.config.get('storage.bucket')}.s3.amazonaws.com/${m.key}`,
        // In a real app, we would trigger a Lambda to generate thumbnails
        thumbnailUrl: `https://${this.config.get('storage.bucket')}.s3.amazonaws.com/${m.key}`, 
      }),
    );

    await this.mediaRepo.save(entities);
    return entities;
  }
}
