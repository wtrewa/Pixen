import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.APP_PORT, 10) || 3000,
  env: process.env.APP_ENV || 'development',
  name: process.env.APP_NAME || 'pixen-backend',
}));
