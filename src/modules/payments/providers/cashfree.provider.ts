import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cashfree, CFEnvironment, CreateOrderRequest, OrderEntity } from 'cashfree-pg';

@Injectable()
export class CashfreeProvider {
  private readonly logger = new Logger(CashfreeProvider.name);
  private cashfree: Cashfree;
  private hasCredentials: boolean;

  constructor(private configService: ConfigService) {
    this.init();
  }

  private init() {
    const clientId = this.configService.get<string>('payment.cashfree.clientId');
    const clientSecret = this.configService.get<string>('payment.cashfree.clientSecret');
    const environment = this.configService.get<string>('payment.cashfree.env');

    this.hasCredentials = !!(clientId && clientSecret);

    this.cashfree = new Cashfree(
      environment === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
      clientId,
      clientSecret,
    );

    if (!this.hasCredentials) {
      this.logger.warn('CASHFREE_CLIENT_ID / CASHFREE_CLIENT_SECRET not set — using mock responses');
    }
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
    if (!this.hasCredentials) {
      this.logger.warn(`[MOCK] createOrder ${data.orderId}`);
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
    if (!this.hasCredentials) {
      this.logger.warn(`[MOCK] getOrder ${orderId}`);
      return [{ payment_status: 'SUCCESS', cf_payment_id: `mock_cf_${Date.now()}` }];
    }

    try {
      const response = await this.cashfree.PGOrderFetchPayments(orderId);
      return response.data;
    } catch (error) {
      this.logger.error('Cashfree Get Order Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async refundOrder(orderId: string, refundAmount: number, refundNote?: string): Promise<any> {
    const refundId = `REFUND_${orderId}_${Date.now()}`;

    if (!this.hasCredentials || orderId.startsWith('mock_') || orderId.includes('mock')) {
      this.logger.warn(`[MOCK] refundOrder ${orderId} → ${refundId}`);
      return {
        refund_id: refundId,
        order_id: orderId,
        refund_amount: refundAmount,
        refund_status: 'SUCCESS',
      };
    }

    try {
      const response = await this.cashfree.PGOrderCreateRefund(orderId, {
        refund_id: refundId,
        refund_amount: refundAmount,
        refund_note: refundNote,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Cashfree Refund Error:', JSON.stringify(error.response?.data || error.message, null, 2));
      throw error;
    }
  }

  verifyWebhook(signature: string, rawBody: string, timestamp: string) {
    return this.cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);
  }
}
