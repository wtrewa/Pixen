import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cashfree, CFConfig, CFOrderRequest, CFOrderPayRequest } from 'cashfree-pg';

@Injectable()
export class CashfreeProvider {
  private readonly logger = new Logger(CashfreeProvider.name);

  constructor(private readonly config: ConfigService) {
    const clientId = this.config.get<string>('CASHFREE_CLIENT_ID');
    const clientSecret = this.config.get<string>('CASHFREE_CLIENT_SECRET');
    const environment = this.config.get<string>('CASHFREE_ENV', 'sandbox');

    if (clientId && clientSecret) {
      Cashfree.XClientId = clientId;
      Cashfree.XClientSecret = clientSecret;
      Cashfree.XEnvironment = environment === 'production' 
        ? Cashfree.Environment.PRODUCTION 
        : Cashfree.Environment.SANDBOX;
    } else {
      this.logger.warn('Cashfree credentials missing. Using sandbox defaults if available.');
    }
  }

  async createOrder(amount: number, currency: string, customerId: string, customerPhone: string, customerEmail: string, bookingId: string) {
    const isDev = this.config.get('APP_ENV') === 'development';
    
    // For development/mocking if credentials are missing
    if (!Cashfree.XClientId || isDev) {
      this.logger.warn(`Using mock Cashfree order (Env: ${this.config.get('APP_ENV')})`);
      return {
        payment_session_id: `session_mock_${Date.now()}`,
        order_id: `order_mock_${Date.now()}`,
        order_status: 'ACTIVE'
      };
    }

    const request: CFOrderRequest = {
      order_amount: amount,
      order_currency: currency,
      customer_details: {
        customer_id: customerId,
        customer_phone: customerPhone || '9999999999',
        customer_email: customerEmail,
      },
      order_meta: {
        return_url: `${this.config.get('FRONTEND_URL')}/bookings/${bookingId}?payment_id={order_id}`,
      },
      order_id: `ORDER_${bookingId}_${Date.now()}`,
    };

    try {
      const response = await Cashfree.PGCreateOrder('2023-08-01', request);
      return response.data;
    } catch (error) {
      this.logger.error('Cashfree Create Order Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getOrder(orderId: string) {
    try {
      const response = await Cashfree.PGOrderFetchPayments('2023-08-01', orderId);
      return response.data;
    } catch (error) {
      this.logger.error('Cashfree Fetch Order Error:', error.response?.data || error.message);
      throw error;
    }
  }
}
