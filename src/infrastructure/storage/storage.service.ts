import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get<string>('storage.bucket');
    this.s3 = new S3Client({
      region: config.get<string>('storage.region'),
      endpoint: config.get<string>('storage.endpoint'),
      credentials: {
        accessKeyId: config.get<string>('storage.accessKeyId'),
        secretAccessKey: config.get<string>('storage.secretAccessKey'),
      },
    });
  }

  async upload(file: Express.Multer.File, folder = 'uploads'): Promise<string> {
    const key = `${folder}/${uuid()}-${file.originalname}`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    const publicUrl = this.config.get<string>('storage.publicUrl');
    if (publicUrl) {
      return `${publicUrl.replace(/\/$/, '')}/${key}`;
    }
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async getPresignedUrl(key: string, contentType?: string, expiresIn = 3600): Promise<string> {
    const command = new PutObjectCommand({ 
      Bucket: this.bucket, 
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  getPublicUrl(key: string): string {
    const publicUrl = this.config.get<string>('storage.publicUrl');
    if (publicUrl) {
      return `${publicUrl.replace(/\/$/, '')}/${key}`;
    }
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }
}
