import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  region: process.env.AWS_REGION || 'auto',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  bucket: process.env.AWS_S3_BUCKET || 'pixen-media',
  endpoint: process.env.AWS_S3_ENDPOINT,
  publicUrl: process.env.AWS_S3_PUBLIC_URL,
}));
