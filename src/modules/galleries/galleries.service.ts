import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
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

  private readonly logger = new Logger(GalleriesService.name);

  async create(vendorId: string, dto: CreateGalleryDto) {
    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : null;
    
    const gallery = this.galleryRepo.create({
      ...dto,
      vendorId,
      passwordHash,
    });

    try {
      await this.galleryRepo.save(gallery);
    } catch (err) {
      this.logger.error(`Failed to save gallery: ${err.message}`, { vendorId, dto });
      throw err;
    }
    
    // Generate a temporary QR code URL placeholder or actual QR code logic here
    gallery.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://pixen.gallery/gallery/${gallery.id}`;
    await this.galleryRepo.save(gallery);

    return gallery;
  }

  async findByVendor(vendorId: string) {
    return this.galleryRepo.find({
      where: { vendorId },
      order: { createdAt: 'DESC' },
      relations: ['booking'],
    });
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
    const gallery = await this.galleryRepo.createQueryBuilder('gallery')
      .addSelect('gallery.passwordHash')
      .where('gallery.id = :id', { id })
      .getOne();
      
    if (!gallery) throw new NotFoundException('Gallery not found');

    if (gallery.passwordHash) {
      if (!password) throw new UnauthorizedException('Password required');
      this.logger.debug(`Validating password for gallery ${id}`);
      const valid = await bcrypt.compare(password, gallery.passwordHash);
      if (!valid) {
        this.logger.warn(`Invalid password attempt for gallery ${id}`);
        throw new UnauthorizedException('Invalid password');
      }
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

  async getUploadUrls(vendorId: string, id: string, files: { name: string; type: string }[]) {
    const gallery = await this.galleryRepo.findOne({ where: { id, vendorId } });
    if (!gallery) throw new ForbiddenException('Access denied');

    const urls = [];
    for (const file of files) {
      const ext = file.name.split('.').pop() || 'jpg';
      const key = `galleries/${id}/${uuid()}.${ext}`;
      const uploadUrl = await this.storageService.getPresignedUrl(key, file.type);
      urls.push({ uploadUrl, key, fileName: file.name });
    }

    return urls;
  }

  async confirmUploads(vendorId: string, id: string, media: { key: string; type: MediaType; name: string }[]) {
    const gallery = await this.galleryRepo.findOne({ where: { id, vendorId } });
    if (!gallery) throw new ForbiddenException('Access denied');

    const entities = media.map((m) =>
      this.mediaRepo.create({
        galleryId: id,
        type: m.type,
        originalUrl: this.storageService.getPublicUrl(m.key),
        thumbnailUrl: this.storageService.getPublicUrl(m.key), 
      }),
    );

    await this.mediaRepo.save(entities);
    return entities;
  }
}
