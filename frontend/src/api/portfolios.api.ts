import api from './axios'
import type { Portfolio, SingleResponse } from '../types'

export const portfoliosApi = {
  create: (data: { title: string; description?: string; category?: string; tags?: string[] }) =>
    api.post<SingleResponse<Portfolio>>('/portfolios', data).then((r) => r.data),

  forVendor: (vendorId: string) =>
    api.get<SingleResponse<Portfolio[]>>(`/portfolios/vendor/${vendorId}`).then((r) => r.data),

  get: (id: string) =>
    api.get<SingleResponse<Portfolio>>(`/portfolios/${id}`).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/portfolios/${id}`).then((r) => r.data),
}
