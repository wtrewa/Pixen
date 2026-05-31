import { Controller, Get, Query, Res, UseGuards, Post, Param } from '@nestjs/common';
import { Response } from 'express';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly config: ConfigService,
  ) {}

  @Get('google/connect')
  @UseGuards(JwtAuthGuard)
  async connectGoogle(@CurrentUser() user: any) {
    const url = this.calendarService.getGoogleAuthUrl(user.id);
    return { url };
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Res() res: Response,
  ) {
    await this.calendarService.handleGoogleCallback(code, userId);
    
    // Redirect back to frontend calendar page
    const frontendUrl = this.config.get<string>('app.frontendUrl');
    return res.redirect(`${frontendUrl}/vendor/calendar?sync=success`);
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  async manualSync(@CurrentUser() user: any) {
    await this.calendarService.syncGoogleCalendar(user.id);
    return { message: 'Calendar sync initiated' };
  }
}
