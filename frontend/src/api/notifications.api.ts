import api from './axios'
import type { Notification, PaginatedResponse, SingleResponse } from '../types'

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Notification>>('/notifications', { params }).then((r) => r.data),

  markRead: (id: string) =>
    api.patch<SingleResponse<Notification>>(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    api.patch('/notifications/read-all').then((r) => r.data),

  unreadCount: () =>
    api.get<SingleResponse<{ count: number }>>('/notifications/unread-count').then((r) => r.data),
}
