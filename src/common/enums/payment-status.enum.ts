export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentType {
  ADVANCE = 'ADVANCE',
  FINAL = 'FINAL',
}

export enum PaymentGateway {
  RAZORPAY = 'RAZORPAY',
  STRIPE = 'STRIPE',
  CASHFREE = 'CASHFREE',
}
