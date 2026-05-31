import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { VendorsRepository } from './vendors.repository';
import { Vendor } from './entities/vendor.entity';
import { VendorService } from './entities/vendor-service.entity';
import { VendorAvailability } from './entities/vendor-availability.entity';
import { VendorEquipment } from './entities/vendor-equipment.entity';
import { ServiceAddon } from './entities/service-addon.entity';

import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vendor, VendorService, VendorAvailability, VendorEquipment, ServiceAddon]),
    BookingsModule,
  ],
  controllers: [VendorsController],
  providers: [VendorsService, VendorsRepository],
  exports: [VendorsService, VendorsRepository],
})
export class VendorsModule {}
