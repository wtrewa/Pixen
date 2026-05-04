import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || process.env.APP_PORT, 10) || 3000,
  env: process.env.APP_ENV || 'development',
  name: process.env.APP_NAME || 'pixen-backend',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
}));
