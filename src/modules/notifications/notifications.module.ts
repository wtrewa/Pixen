import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationProcessor } from './processors/notification.processor';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { EmailModule } from '../../infrastructure/email/email.module';
import { QUEUES } from '../../common/constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, Vendor]),
    BullModule.registerQueue({ name: QUEUES.NOTIFICATIONS }),
    EmailModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
