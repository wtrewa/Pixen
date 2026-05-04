import * as Joi from 'joi';

export const validationSchema = Joi.object({
  APP_PORT: Joi.number().default(3000),
  APP_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  APP_NAME: Joi.string().default('pixen-backend'),
  FRONTEND_URL: Joi.string().optional(),

  DATABASE_URL: Joi.string().optional(),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default('postgres'),
  DB_NAME: Joi.string().default('pixen_db'),
  DB_SYNC: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),

  REDIS_URL: Joi.string().optional(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),
  REDIS_TTL: Joi.number().default(300),

  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_CALLBACK_URL: Joi.string().optional(),

  AWS_REGION: Joi.string().default('ap-south-1'),
  AWS_ACCESS_KEY_ID: Joi.string().optional().allow(''),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional().allow(''),
  AWS_S3_BUCKET: Joi.string().default('pixen-media'),

  SMTP_HOST: Joi.string().default('smtp.gmail.com'),
  SMTP_PORT: Joi.number().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().optional().allow(''),
  SMTP_PASS: Joi.string().optional().allow(''),
  SMTP_FROM: Joi.string().default('noreply@pixen.in'),

  PAYMENT_GATEWAY: Joi.string().valid('CASHFREE', 'RAZORPAY').default('CASHFREE'),
  CASHFREE_CLIENT_ID: Joi.string().optional().allow(''),
  CASHFREE_CLIENT_SECRET: Joi.string().optional().allow(''),
  CASHFREE_ENV: Joi.string().valid('sandbox', 'production').default('sandbox'),
  RAZORPAY_KEY_ID: Joi.string().optional().allow(''),
  RAZORPAY_KEY_SECRET: Joi.string().optional().allow(''),
  RAZORPAY_WEBHOOK_SECRET: Joi.string().optional().allow(''),

  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),
}).options({ allowUnknown: true });
