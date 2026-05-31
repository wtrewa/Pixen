import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { google } from 'googleapis';
import { CalendarConnection, CalendarProvider } from './entities/calendar-connection.entity';
import { VendorAvailability } from '../vendors/entities/vendor-availability.entity';
import { VendorsRepository } from '../vendors/vendors.repository';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private oauth2Client: any;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(CalendarConnection)
    private readonly connectionRepository: Repository<CalendarConnection>,
    @InjectRepository(VendorAvailability)
    private readonly availabilityRepository: Repository<VendorAvailability>,
    private readonly vendorsRepository: VendorsRepository,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      this.config.get<string>('app.google.clientId'),
      this.config.get<string>('app.google.clientSecret'),
      this.config.get<string>('app.google.calendarCallbackUrl'),
    );
  }

  getGoogleAuthUrl(userId: string) {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: userId, // Pass userId in state to correlate on callback
    });
  }

  async handleGoogleCallback(code: string, userId: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    // Get user email from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Check if connection already exists
    let connection = await this.connectionRepository.findOne({
      where: { userId, provider: CalendarProvider.GOOGLE },
    });

    if (!connection) {
      connection = this.connectionRepository.create({
        userId,
        provider: CalendarProvider.GOOGLE,
      });
    }

    connection.accessToken = tokens.access_token;
    if (tokens.refresh_token) {
      connection.refreshToken = tokens.refresh_token;
    }
    connection.tokenExpiresAt = new Date(tokens.expiry_date);
    connection.externalEmail = userInfo.data.email;
    connection.isSyncEnabled = true;

    await this.connectionRepository.save(connection);
    
    // Trigger initial sync
    await this.syncGoogleCalendar(userId);

    return connection;
  }

  async syncGoogleCalendar(userId: string) {
    const connection = await this.connectionRepository.findOne({
      where: { userId, provider: CalendarProvider.GOOGLE },
    });

    if (!connection || !connection.isSyncEnabled) return;

    this.logger.log(`Syncing Google Calendar for user ${userId}`);

    // Set credentials
    this.oauth2Client.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken,
      expiry_date: connection.tokenExpiresAt.getTime(),
    });

    // Check if token expired and refresh if needed
    if (Date.now() > connection.tokenExpiresAt.getTime() && connection.refreshToken) {
      const { tokens } = await this.oauth2Client.refreshAccessToken();
      connection.accessToken = tokens.access_token;
      connection.tokenExpiresAt = new Date(tokens.expiry_date);
      await this.connectionRepository.save(connection);
    }

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    // Fetch events for the next 6 months
    const now = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(now.getMonth() + 6);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: sixMonthsLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    const vendor = await this.vendorsRepository.findByUserId(userId);
    if (!vendor) return;

    // Get current synced dates to know what to remove
    const currentSynced = await this.availabilityRepository.find({
      where: { vendorId: vendor.id, source: 'GOOGLE_CALENDAR' },
    });

    const processedEventIds = new Set<string>();

    for (const event of events) {
      // We only care about "busy" events (transparency !== 'transparent')
      // Note: In Google Calendar, 'transparent' means 'Available'
      if (event.transparency === 'transparent') continue;

      const start = event.start.dateTime || event.start.date;
      const end = event.end.dateTime || event.end.date;
      
      if (!start || !end) continue;

      // Get all dates covered by the event
      const dates = this.getDatesInRange(new Date(start), new Date(end));
      
      for (const dateStr of dates) {
        const externalId = `${event.id}_${dateStr}`;
        processedEventIds.add(externalId);

        const existing = await this.availabilityRepository.findOne({
          where: { vendorId: vendor.id, externalEventId: externalId },
        });

        if (!existing) {
          await this.availabilityRepository.save({
            vendorId: vendor.id,
            date: dateStr,
            isBlocked: true,
            reason: `Google Calendar: ${event.summary || 'Busy'}`,
            source: 'GOOGLE_CALENDAR',
            externalEventId: externalId,
          });
        }
      }
    }

    // Remove old synced dates that are no longer in the calendar
    const toRemove = currentSynced.filter(s => !processedEventIds.has(s.externalEventId));
    if (toRemove.length > 0) {
      await this.availabilityRepository.remove(toRemove);
    }

    connection.lastSyncedAt = new Date();
    await this.connectionRepository.save(connection);
  }

  private getDatesInRange(startDate: Date, endDate: Date): string[] {
    const dates: string[] = [];
    const curr = new Date(startDate);
    curr.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    // If it's an all-day event, Google sets the end date to the NEXT day at 00:00
    // So we subtract a small amount to stay within the intended days
    const adjustedEnd = new Date(endDate.getTime() - 1);
    adjustedEnd.setHours(0, 0, 0, 0);

    while (curr <= adjustedEnd) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  }
}
