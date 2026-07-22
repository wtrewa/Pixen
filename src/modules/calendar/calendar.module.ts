import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { QUEUES } from '../../common/constants';
import { CalendarConnection } from './entities/calendar-connection.entity';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { CalendarProcessor } from './calendar.processor';
import { VendorAvailability } from '../vendors/entities/vendor-availability.entity';
import { VendorsModule } from '../vendors/vendors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CalendarConnection, VendorAvailability]),
    BullModule.registerQueue({
      name: QUEUES.CALENDAR_SYNC,
    }),
    JwtModule.register({}),
    VendorsModule,
  ],
  controllers: [CalendarController],
  providers: [CalendarService, CalendarProcessor],
  exports: [CalendarService],
})
export class CalendarModule {}
