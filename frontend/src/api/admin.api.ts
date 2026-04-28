import api from './axios'
import type { User, Vendor, AdminDashboard, PaginatedResponse, SingleResponse } from '../types'

export const adminApi = {
  dashboard: () =>
    api.get<SingleResponse<AdminDashboard>>('/admin/dashboard').then((r) => r.data),

  users: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<User>>('/admin/users', { params }).then((r) => r.data),

  toggleUser: (id: string) =>
    api.patch<SingleResponse<User>>(`/admin/users/${id}/toggle`).then((r) => r.data),

  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`).then((r) => r.data),

  vendors: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Vendor>>('/admin/vendors', { params }).then((r) => r.data),

  deleteVendor: (id: string) =>
    api.delete(`/admin/vendors/${id}`).then((r) => r.data),

  auditLogs: () =>
    api.get('/admin/audit-logs').then((r) => r.data),
}
