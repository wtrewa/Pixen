import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || process.env.APP_PORT, 10) || 3000,
  env: process.env.APP_ENV || 'development',
  name: process.env.APP_NAME || 'pixen-backend',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
}));
