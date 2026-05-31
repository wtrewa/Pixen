export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

export const QUEUES = {
  NOTIFICATIONS: 'notifications',
  EMAILS: 'emails',
  PAYMENTS: 'payments',
  CALENDAR_SYNC: 'calendar_sync',
} as const;

export const CACHE_KEYS = {
  VENDOR_LIST: 'vendor:list',
  VENDOR_DETAIL: (id: string) => `vendor:${id}`,
  USER_PROFILE: (id: string) => `user:${id}`,
} as const;
