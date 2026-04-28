import { BadRequestException } from '@nestjs/common';
import { BookingStatus } from '../../../common/enums/booking-status.enum';

type Transition = Partial<Record<BookingStatus, BookingStatus[]>>;

const ALLOWED_TRANSITIONS: Transition = {
  [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.SHOOT_COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.SHOOT_COMPLETED]: [BookingStatus.DELIVERED, BookingStatus.CANCELLED],
  [BookingStatus.DELIVERED]: [BookingStatus.COMPLETED],
  [BookingStatus.COMPLETED]: [BookingStatus.REFUNDED],
  [BookingStatus.CANCELLED]: [BookingStatus.REFUNDED],
  [BookingStatus.REFUNDED]: [],
};

export function assertValidTransition(from: BookingStatus, to: BookingStatus): void {
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Invalid status transition: ${from} → ${to}. Allowed: [${allowed.join(', ')}]`,
    );
  }
}
