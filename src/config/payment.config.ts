import { registerAs } from '@nestjs/config';

export default registerAs('payment', () => ({
  gateway: process.env.PAYMENT_GATEWAY || 'CASHFREE',
  cashfree: {
    clientId: process.env.CASHFREE_CLIENT_ID,
    clientSecret: process.env.CASHFREE_CLIENT_SECRET,
    env: process.env.CASHFREE_ENV || 'sandbox',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },
}));
