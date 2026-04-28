import api from './axios'
import type { Review, PaginatedResponse, SingleResponse } from '../types'

export const reviewsApi = {
  create: (data: { bookingId: string; rating: number; comment?: string }) =>
    api.post<SingleResponse<Review>>('/reviews', data).then((r) => r.data),

  forVendor: (vendorId: string, params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Review>>(`/reviews/vendor/${vendorId}`, { params }).then((r) => r.data),
}
