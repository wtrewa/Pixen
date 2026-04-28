import api from './axios'
import type { Post, PaginatedResponse, SingleResponse } from '../types'

export const postsApi = {
  trending: (limit?: number) =>
    api.get<SingleResponse<Post[]>>('/posts/trending', { params: { limit } }).then((r) => r.data),

  forVendor: (vendorId: string, params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Post>>(`/posts/vendor/${vendorId}`, { params }).then((r) => r.data),

  create: (data: { type: 'IMAGE' | 'VIDEO'; url: string; caption?: string; category?: string }) =>
    api.post<SingleResponse<Post>>('/posts', data).then((r) => r.data),

  like: (id: string) =>
    api.patch<SingleResponse<Post>>(`/posts/${id}/like`).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/posts/${id}`).then((r) => r.data),
}
