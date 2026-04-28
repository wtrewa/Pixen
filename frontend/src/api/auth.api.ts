import api from './axios'
import type { AuthResponse, SingleResponse, User } from '../types'

export const authApi = {
  register: (data: { fullName: string; email: string; password: string; role: 'CUSTOMER' | 'VENDOR' }) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  logout: () => api.post('/auth/logout').then((r) => r.data),

  me: () => api.get<SingleResponse<User>>('/auth/me').then((r) => r.data),
}
