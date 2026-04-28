import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingsRepository } from './bookings.repository';
import { Booking } from './entities/booking.entity';
import { QUEUES } from '../../common/constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    BullModule.registerQueue({ name: QUEUES.NOTIFICATIONS }),
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsRepository],
  exports: [BookingsService, BookingsRepository],
})
export class BookingsModule {}
