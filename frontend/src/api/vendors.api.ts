import api from './axios'
import type { Vendor, Service, AvailabilityBlock, VendorStats, PaginatedResponse, SingleResponse } from '../types'

export const vendorsApi = {
  list: (params?: { page?: number; limit?: number; category?: string; city?: string; search?: string }) =>
    api.get<PaginatedResponse<Vendor>>('/vendors', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<SingleResponse<Vendor>>(`/vendors/${id}`).then((r) => r.data),

  create: (data: Partial<Vendor>) =>
    api.post<SingleResponse<Vendor>>('/vendors', data).then((r) => r.data),

  update: (id: string, data: Partial<Vendor>) =>
    api.patch<SingleResponse<Vendor>>(`/vendors/${id}`, data).then((r) => r.data),

  stats: (id: string) =>
    api.get<SingleResponse<VendorStats>>(`/vendors/${id}/stats`).then((r) => r.data),

  addService: (id: string, data: Omit<Service, 'id' | 'vendorId'>) =>
    api.post<SingleResponse<Service>>(`/vendors/${id}/services`, data).then((r) => r.data),

  deleteService: (id: string, serviceId: string) =>
    api.delete(`/vendors/${id}/services/${serviceId}`).then((r) => r.data),

  getAvailability: (id: string) =>
    api.get<SingleResponse<AvailabilityBlock[]>>(`/vendors/${id}/availability`).then((r) => r.data),

  blockDate: (id: string, data: { date: string; reason?: string }) =>
    api.post<SingleResponse<AvailabilityBlock>>(`/vendors/${id}/availability/block`, data).then((r) => r.data),

  unblockDate: (id: string, availId: string) =>
    api.delete(`/vendors/${id}/availability/${availId}`).then((r) => r.data),

  verify: (id: string, isVerified: boolean) =>
    api.patch(`/vendors/${id}/verify`, { isVerified }).then((r) => r.data),
}
