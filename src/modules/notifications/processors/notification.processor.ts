import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bull';
import { NotificationsService } from '../notifications.service';
import { EmailService } from '../../../infrastructure/email/email.service';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { User } from '../../users/entities/user.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { QUEUES } from '../../../common/constants';

@Processor(QUEUES.NOTIFICATIONS)
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Vendor) private readonly vendorRepo: Repository<Vendor>,
  ) {}

  private async getUserEmail(userId: string): Promise<string | null> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return user?.email ?? null;
  }

  private async getVendorUserEmail(vendorId: string): Promise<string | null> {
    const vendor = await this.vendorRepo.findOne({ where: { id: vendorId } });
    if (!vendor) return null;
    return this.getUserEmail(vendor.userId);
  }

  @Process('booking-created')
  async handleBookingCreated(job: Job) {
    this.logger.log(`Processing booking-created [${job.id}]`);
    const { bookingId, customerId, vendorId } = job.data;

    await this.notificationsService.create({
      userId: customerId,
      type: NotificationType.BOOKING_CREATED,
      title: 'Booking Submitted',
      message: 'Your booking request has been sent to the vendor.',
      metadata: { bookingId },
    });

    const [customerEmail, vendorEmail] = await Promise.all([
      this.getUserEmail(customerId),
      this.getVendorUserEmail(vendorId),
    ]);

    if (customerEmail) {
      await this.emailService.send({
        to: customerEmail,
        subject: 'Booking Request Received - Pixen',
        html: `<p>Your booking request has been submitted. We will notify you once the vendor confirms.</p>`,
      });
    }
    if (vendorEmail) {
      await this.emailService.send({
        to: vendorEmail,
        subject: 'New Booking Request - Pixen',
        html: `<p>You have received a new booking request. Please log in to review and confirm.</p>`,
      });
    }
  }

  @Process('booking-status-changed')
  async handleBookingStatusChanged(job: Job) {
    this.logger.log(`Processing booking-status-changed [${job.id}]`);
    const { bookingId, newStatus, customerId, vendorId } = job.data;

    const typeMap: Record<string, NotificationType> = {
      CONFIRMED: NotificationType.BOOKING_CONFIRMED,
      CANCELLED: NotificationType.BOOKING_CANCELLED,
      COMPLETED: NotificationType.BOOKING_COMPLETED,
    };

    await this.notificationsService.create({
      userId: customerId,
      type: typeMap[newStatus] ?? NotificationType.GENERAL,
      title: `Booking ${newStatus}`,
      message: `Your booking status has been updated to ${newStatus}.`,
      metadata: { bookingId },
    });

    if (newStatus === 'CONFIRMED') {
      const [customerEmail, vendorEmail] = await Promise.all([
        this.getUserEmail(customerId),
        this.getVendorUserEmail(vendorId),
      ]);

      if (customerEmail) {
        await this.emailService.send({
          to: customerEmail,
          subject: 'Booking Confirmed - Pixen',
          html: `<p>Great news! Your booking has been confirmed by the vendor. Please proceed with the advance payment to secure your slot.</p>`,
        });
      }
      if (vendorEmail) {
        await this.emailService.send({
          to: vendorEmail,
          subject: 'New Job Confirmed - Pixen',
          html: `<p>A booking has been confirmed. Please check your dashboard for full details.</p>`,
        });
      }
    }

    if (newStatus === 'CANCELLED') {
      const customerEmail = await this.getUserEmail(customerId);
      if (customerEmail) {
        await this.emailService.send({
          to: customerEmail,
          subject: 'Booking Cancelled - Pixen',
          html: `<p>Your booking has been cancelled. Please contact support if you have any questions.</p>`,
        });
      }
    }
  }

  @Process('payment-success')
  async handlePaymentSuccess(job: Job) {
    this.logger.log(`Processing payment-success [${job.id}]`);
    const { userId, amount, paymentId } = job.data;

    await this.notificationsService.create({
      userId,
      type: NotificationType.PAYMENT_SUCCESS,
      title: 'Payment Successful',
      message: `Payment of ₹${amount} was successful.`,
      metadata: { paymentId },
    });

    const email = await this.getUserEmail(userId);
    if (email) {
      await this.emailService.send({
        to: email,
        subject: 'Payment Successful - Pixen',
        html: `<p>Your payment of ₹${amount} has been received successfully. Payment ID: ${paymentId}</p>`,
      });
    }
  }

  @Process('shoot-completed')
  async handleShootCompleted(job: Job) {
    this.logger.log(`Processing shoot-completed [${job.id}]`);
    const { bookingId, customerId, availableAgain } = job.data;

    await this.notificationsService.create({
      userId: customerId,
      type: NotificationType.GENERAL,
      title: 'Shoot Completed',
      message: `Your shoot has been completed. Files will be delivered soon.`,
      metadata: { bookingId },
    });

    const email = await this.getUserEmail(customerId);
    if (email) {
      await this.emailService.send({
        to: email,
        subject: 'Shoot Completed - Pixen',
        html: `<p>Your shoot has been completed successfully! Your vendor will deliver the edited files shortly.</p>`,
      });
    }
  }

  @Process('booking-delivered')
  async handleBookingDelivered(job: Job) {
    this.logger.log(`Processing booking-delivered [${job.id}]`);
    const { bookingId, customerId, deliveryLink } = job.data;

    await this.notificationsService.create({
      userId: customerId,
      type: NotificationType.GENERAL,
      title: 'Files Delivered',
      message: 'Your files have been delivered. Please review and confirm.',
      metadata: { bookingId, deliveryLink },
    });

    const email = await this.getUserEmail(customerId);
    if (email) {
      await this.emailService.send({
        to: email,
        subject: 'Your Files Are Ready - Pixen',
        html: `<p>Your files have been delivered! <a href="${deliveryLink}">Click here to download your files</a>.</p><p>Please review and mark the booking as complete once satisfied.</p>`,
      });
    }
  }
}
