export type Role = 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'SUPER_ADMIN'

export interface User {
  id: string
  fullName: string
  email: string
  role: Role
  isActive: boolean
  createdAt: string
  vendor?: Vendor
}

export interface Vendor {
  id: string
  businessName: string
  businessDescription: string
  category: string
  city: string
  state: string
  country: string
  address: string
  teamCount: number
  isVerified: boolean
  averageRating?: number
  totalReviews?: number
  services?: Service[]
  portfolios?: Portfolio[]
  user?: User
  createdAt: string
}

export interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: string
  vendorId: string
}

export interface Portfolio {
  id: string
  title: string
  description?: string
  category?: string
  tags?: string[]
  vendorId: string
  createdAt: string
}

export interface Post {
  id: string
  type: 'IMAGE' | 'VIDEO'
  url: string
  caption?: string
  category?: string
  likes: number
  vendorId: string
  vendor?: Vendor
  createdAt: string
}

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'SHOOT_COMPLETED'
  | 'DELIVERED'
  | 'COMPLETED'

export interface Booking {
  id: string
  customerId: string
  vendorId: string
  serviceId: string
  eventDate: string
  eventAddress: string
  notes?: string
  advanceAmount: number
  totalAmount: number
  status: BookingStatus
  cancellationReason?: string
  deliveryLink?: string
  deliveryNotes?: string
  customer?: User
  vendor?: Vendor
  service?: Service
  payments?: Payment[]
  review?: Review
  createdAt: string
}

export type PaymentType = 'ADVANCE' | 'FINAL'
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED'

export interface Payment {
  id: string
  bookingId: string
  type: PaymentType
  amount: number
  status: PaymentStatus
  razorpayOrderId?: string
  razorpayPaymentId?: string
  createdAt: string
}

export interface Review {
  id: string
  bookingId: string
  vendorId: string
  customerId: string
  rating: number
  comment?: string
  customer?: User
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface Promotion {
  id: string
  code: string
  discountPercent: number
  maxUses: number
  usedCount: number
  isActive: boolean
  expiresAt?: string
}

export interface VendorStats {
  totalRevenue: number
  activeLeads: number
  upcomingEvents: number
  totalInquiries: number
}

export interface AdminDashboard {
  totalUsers: number
  totalVendors: number
  totalBookings: number
  totalRevenue: number
  bookingsByStatus: Record<BookingStatus, number>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface SingleResponse<T> {
  data: T
  message: string
}

export interface AuthResponse {
  data: {
    user: User
    accessToken: string
    refreshToken: string
  }
  message: string
}

export interface AvailabilityBlock {
  id: string
  vendorId: string
  date: string
  reason?: string
}
