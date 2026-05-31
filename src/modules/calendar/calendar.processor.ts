import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QUEUES } from '../../common/constants';
import { CalendarService } from './calendar.service';
import { InjectRepository } from '@nestjs/typeorm';
import { CalendarConnection } from './entities/calendar-connection.entity';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

@Processor(QUEUES.CALENDAR_SYNC)
export class CalendarProcessor {
  private readonly logger = new Logger(CalendarProcessor.name);

  constructor(
    private readonly calendarService: CalendarService,
    @InjectRepository(CalendarConnection)
    private readonly connectionRepository: Repository<CalendarConnection>,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron() {
    this.logger.log('Executing scheduled calendar sync');
    await this.syncAllConnections();
  }

  @Process('sync-all')
  async syncAllConnections() {
    this.logger.log('Starting global calendar sync job');
    
    const connections = await this.connectionRepository.find({
      where: { isSyncEnabled: true },
    });

    for (const connection of connections) {
      try {
        await this.calendarService.syncGoogleCalendar(connection.userId);
      } catch (err) {
        this.logger.error(`Failed to sync calendar for user ${connection.userId}: ${err.message}`);
      }
    }
    
    this.logger.log('Global calendar sync job completed');
  }
}
