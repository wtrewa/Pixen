import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingsRepository } from './bookings.repository';
import { Booking } from './entities/booking.entity';
import { BookingAddon } from './entities/booking-addon.entity';
import { BookingCustomRequest } from './entities/booking-custom-request.entity';
import { BookingCollaborator } from './entities/booking-collaborator.entity';
import { ServiceAddon } from '../vendors/entities/service-addon.entity';
import { PromotionsModule } from '../promotions/promotions.module';
import { QUEUES } from '../../common/constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, BookingAddon, BookingCustomRequest, BookingCollaborator, ServiceAddon]),
    BullModule.registerQueue({ name: QUEUES.NOTIFICATIONS }),
    PromotionsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsRepository],
  exports: [BookingsService, BookingsRepository],
})
export class BookingsModule {}

