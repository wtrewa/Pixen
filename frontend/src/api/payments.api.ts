import api from './axios'
import type { Payment, SingleResponse } from '../types'

export const paymentsApi = {
  initiate: (data: { bookingId: string; type: 'ADVANCE' | 'FINAL' }) =>
    api.post<SingleResponse<{ order: Record<string, unknown>; key: string }>>('/payments/initiate', data).then((r) => r.data),

  verify: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    api.post<SingleResponse<Payment>>('/payments/verify', data).then((r) => r.data),

  forBooking: (bookingId: string) =>
    api.get<SingleResponse<Payment[]>>(`/payments/booking/${bookingId}`).then((r) => r.data),
}
