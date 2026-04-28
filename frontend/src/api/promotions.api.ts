import api from './axios'
import type { Promotion, SingleResponse } from '../types'

export const promotionsApi = {
  list: () =>
    api.get<SingleResponse<Promotion[]>>('/promotions').then((r) => r.data),

  validate: (code: string) =>
    api.post<SingleResponse<Promotion>>('/promotions/validate', { code }).then((r) => r.data),

  create: (data: Partial<Promotion>) =>
    api.post<SingleResponse<Promotion>>('/promotions', data).then((r) => r.data),

  toggle: (id: string) =>
    api.patch<SingleResponse<Promotion>>(`/promotions/${id}/toggle`).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/promotions/${id}`).then((r) => r.data),
}
