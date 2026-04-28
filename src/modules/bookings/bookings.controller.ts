import {
  Controller, Get, Post, Body, Patch, Param, Query, UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { DeliverBookingDto } from './dto/deliver-booking.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { User } from '../users/entities/user.entity';
import { Booking } from './entities/booking.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Bookings & Handover')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Create a new booking request' })
  @ApiResponse({ status: 201, description: 'Booking created', type: Booking })
  create(@CurrentUser() user: User, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Get current customer bookings' })
  myBookings(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.bookingsService.findMyBookings(user.id, +page, +limit);
  }

  @Get('vendor/:vendorId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get vendor bookings' })
  vendorBookings(
    @Param('vendorId') vendorId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.bookingsService.findVendorBookings(vendorId, +page, +limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get booking details by ID' })
  @ApiResponse({ status: 200, type: Booking })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.bookingsService.findOne(id, user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update booking status (state machine enforced)' })
  @ApiResponse({ status: 200, description: 'Status updated', type: Booking })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, user, dto);
  }

  @Patch(':id/complete-shoot')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Mark the shoot/event as completed (Vendor only)' })
  @ApiResponse({ status: 200, description: 'Shoot marked completed', type: Booking })
  completeShoot(@Param('id') id: string, @CurrentUser() user: User) {
    return this.bookingsService.completeShoot(id, user);
  }

  @Patch(':id/deliver')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Submit delivery link for final files (Vendor only)' })
  @ApiResponse({ status: 200, description: 'Files delivered', type: Booking })
  deliver(
    @Param('id') id: string, 
    @CurrentUser() user: User, 
    @Body() dto: DeliverBookingDto
  ) {
    return this.bookingsService.deliver(id, user, dto);
  }
}
