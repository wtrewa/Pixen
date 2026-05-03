import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cashfree, CFEnvironment, CreateOrderRequest, OrderEntity } from 'cashfree-pg';

@Injectable()
export class CashfreeProvider {
  private readonly logger = new Logger(CashfreeProvider.name);
  private cashfree: Cashfree;

  constructor(private configService: ConfigService) {
    this.init();
  }

  private init() {
    const clientId = this.configService.get<string>('CASHFREE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('CASHFREE_CLIENT_SECRET');
    const environment = this.configService.get<string>('CASHFREE_ENV', 'sandbox');

    this.cashfree = new Cashfree(
      environment === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
      clientId,
      clientSecret
    );
  }

  async createOrder(data: {
    orderId: string;
    amount: number;
    currency: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    returnUrl: string;
  }): Promise<OrderEntity> {
    const isDev = this.configService.get<string>('NODE_ENV') !== 'production';

    // Mock response for dev if no credentials
    if (!this.cashfree.XClientId || isDev) {
      this.logger.warn('Using mock Cashfree order for development');
      return {
        cf_order_id: 'mock_cf_order_' + Date.now(),
        order_id: data.orderId,
        order_amount: data.amount,
        order_currency: data.currency,
        order_status: 'ACTIVE',
        payment_session_id: 'mock_session_' + Math.random().toString(36).substring(7),
      } as any;
    }

    const request: CreateOrderRequest = {
      order_id: data.orderId,
      order_amount: data.amount,
      order_currency: data.currency,
      customer_details: {
        customer_id: data.customerId,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone,
      },
      order_meta: {
        return_url: data.returnUrl,
      },
    };

    try {
      const response = await this.cashfree.PGCreateOrder(request);
      return response.data;
    } catch (error) {
      this.logger.error('Cashfree Create Order Error:', JSON.stringify(error.response?.data || error.message, null, 2));
      throw error;
    }
  }

  async getOrder(orderId: string): Promise<any> {
    const isDev = this.configService.get<string>('NODE_ENV') !== 'production';
    if (!this.cashfree.XClientId || isDev) {
      return { order_status: 'PAID' }; // Mock success
    }

    try {
      const response = await this.cashfree.PGOrderFetchPayments(orderId);
      return response.data;
    } catch (error) {
      this.logger.error('Cashfree Get Order Error:', error.response?.data || error.message);
      throw error;
    }
  }

  verifyWebhook(signature: string, rawBody: string, timestamp: string) {
    return this.cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);
  }
}
