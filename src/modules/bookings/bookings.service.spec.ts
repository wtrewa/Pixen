import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';
import { BookingsService } from './bookings.service';
import { BookingsRepository } from './bookings.repository';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { Role } from '../../common/enums/roles.enum';
import { QUEUES } from '../../common/constants';

const mockRepo = {
  findById: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  findByCustomer: jest.fn(),
};

const mockQueue = { add: jest.fn() };

describe('BookingsService', () => {
  let service: BookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: BookingsRepository, useValue: mockRepo },
        { provide: getQueueToken(QUEUES.NOTIFICATIONS), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    jest.clearAllMocks();
  });

  describe('updateStatus (state machine)', () => {
    it('should allow PENDING → CONFIRMED', async () => {
      const user: any = { id: 'u1', role: Role.VENDOR };
      const booking = {
        id: 'b1',
        customerId: 'c1',
        vendorId: 'v1',
        vendor: { userId: 'u1' },
        status: BookingStatus.PENDING,
      };
      mockRepo.findById.mockResolvedValue(booking);
      mockRepo.updateStatus.mockResolvedValue({ ...booking, status: BookingStatus.CONFIRMED });

      await service.updateStatus('b1', user, { status: BookingStatus.CONFIRMED });
      expect(mockRepo.updateStatus).toHaveBeenCalledWith('b1', BookingStatus.CONFIRMED, undefined);
    });

    it('should reject PENDING → COMPLETED (invalid transition)', async () => {
      const user: any = { id: 'u1', role: Role.VENDOR };
      mockRepo.findById.mockResolvedValue({
        id: 'b1',
        customerId: 'c1',
        vendorId: 'v1',
        vendor: { userId: 'u1' },
        status: BookingStatus.PENDING,
      });

      await expect(
        service.updateStatus('b1', user, { status: BookingStatus.COMPLETED }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
