import api from './axios'
import type { Booking, BookingStatus, PaginatedResponse, SingleResponse } from '../types'

export const bookingsApi = {
  create: (data: {
    vendorId: string
    serviceId: string
    eventDate: string
    eventAddress: string
    notes?: string
    advanceAmount: number
    totalAmount: number
  }) => api.post<SingleResponse<Booking>>('/bookings', data).then((r) => r.data),

  mine: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Booking>>('/bookings/mine', { params }).then((r) => r.data),

  vendor: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Booking>>('/bookings/vendor', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<SingleResponse<Booking>>(`/bookings/${id}`).then((r) => r.data),

  updateStatus: (id: string, data: { status: BookingStatus; cancellationReason?: string }) =>
    api.patch<SingleResponse<Booking>>(`/bookings/${id}/status`, data).then((r) => r.data),

  completeShoot: (id: string) =>
    api.post<SingleResponse<Booking>>(`/bookings/${id}/complete-shoot`).then((r) => r.data),

  deliver: (id: string, data: { deliveryLink: string; notes?: string }) =>
    api.post<SingleResponse<Booking>>(`/bookings/${id}/deliver`, data).then((r) => r.data),
}
