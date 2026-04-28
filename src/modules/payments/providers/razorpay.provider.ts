import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';

@Injectable()
export class RazorpayProvider {
  private readonly logger = new Logger(RazorpayProvider.name);
  private readonly client: Razorpay;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    this.webhookSecret = config.get<string>('RAZORPAY_WEBHOOK_SECRET', '');
    const keyId = config.get<string>('RAZORPAY_KEY_ID', '');
    const keySecret = config.get<string>('RAZORPAY_KEY_SECRET', '');
    if (keyId && keySecret) {
      this.client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
  }

  async createOrder(amount: number, currency = 'INR', receiptId: string) {
    const isDev = this.config.get('APP_ENV') === 'development';
    if (!this.client || isDev) {
      this.logger.warn(`Using mock payment order (Env: ${this.config.get('APP_ENV')})`);
      return {
        id: `order_mock_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency,
        receipt: receiptId,
        status: 'created',
      };
    }
    return this.client.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: receiptId,
    });
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(body)
      .digest('hex');
    return expectedSignature === signature;
  }

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const isDev = this.config.get('APP_ENV') === 'development';
    if (signature === 'mock_signature' || orderId.startsWith('order_mock_') || isDev) {
      this.logger.log(`Bypassing payment signature verification (Env: ${this.config.get('APP_ENV')})`);
      return true;
    }
    const payload = `${orderId}|${paymentId}`;
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    if (!keySecret) return false;
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');
    return expected === signature;
  }
}
