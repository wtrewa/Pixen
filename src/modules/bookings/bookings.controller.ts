import {
  Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Delete, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { DeliverBookingDto } from './dto/deliver-booking.dto';
import { ConfirmBookingDto } from './dto/confirm-booking.dto';
import { InviteCollaboratorDto } from './dto/invite-collaborator.dto';
import { RespondCollaboratorDto } from './dto/respond-collaborator.dto';
import { QuoteCustomRequestDto } from './dto/quote-custom-request.dto';
import { RespondCustomRequestDto } from './dto/respond-custom-request.dto';
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
    @Query('status') status?: string,
  ) {
    return this.bookingsService.findMyBookings(user.id, +page, +limit, status);
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

  @Get('collaborator-invites/:vendorId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Get pending collaborator invites for a vendor' })
  getCollaboratorInvites(@Param('vendorId') vendorId: string) {
    return this.bookingsService.getMyCollaboratorInvites(vendorId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get booking details by ID' })
  @ApiResponse({ status: 200, type: Booking })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.bookingsService.findOne(id, user);
  }

  @Patch(':id/confirm')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR, Role.ADMIN)
  @ApiOperation({ summary: 'Vendor accepts booking and sets advance amount required' })
  confirm(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: ConfirmBookingDto) {
    return this.bookingsService.confirmByVendor(id, user, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update booking status (state machine enforced)' })
  updateStatus(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(id, user, dto);
  }

  @Patch(':id/complete-shoot')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Mark the shoot/event as completed (Vendor only)' })
  completeShoot(@Param('id') id: string, @CurrentUser() user: User) {
    return this.bookingsService.completeShoot(id, user);
  }

  @Patch(':id/deliver')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Submit delivery link for final files (Vendor only)' })
  deliver(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: DeliverBookingDto) {
    return this.bookingsService.deliver(id, user, dto);
  }

  // ── Add-ons & Custom Requests ──────────────────────────────────────────────

  @Get(':id/addons')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get add-ons attached to a booking' })
  getAddons(@Param('id') id: string) {
    return this.bookingsService.getBookingAddons(id);
  }

  @Get(':id/custom-requests')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get custom requests for a booking' })
  getCustomRequests(@Param('id') id: string) {
    return this.bookingsService.getBookingCustomRequests(id);
  }

  @Patch('custom-requests/:requestId/quote')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Vendor submits a price quote for a custom request' })
  quoteCustomRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: User,
    @Body() dto: QuoteCustomRequestDto,
  ) {
    return this.bookingsService.quoteCustomRequest(requestId, user, dto);
  }

  @Patch('custom-requests/:requestId/respond')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Customer accepts or rejects a custom request quote' })
  respondToCustomRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: User,
    @Body() dto: RespondCustomRequestDto,
  ) {
    return this.bookingsService.respondToCustomRequest(requestId, user, dto);
  }

  // ── Collaborators ──────────────────────────────────────────────────────────

  @Get(':id/collaborators')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get collaborators for a booking' })
  getCollaborators(@Param('id') id: string) {
    return this.bookingsService.getBookingCollaborators(id);
  }

  @Post(':id/collaborators')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Primary vendor invites another vendor to collaborate on this booking' })
  inviteCollaborator(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: InviteCollaboratorDto,
  ) {
    return this.bookingsService.inviteCollaborator(id, user, dto);
  }

  @Patch('collaborators/:collaboratorId/respond')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Invited vendor accepts or rejects a collaboration invite' })
  respondToCollaboratorInvite(
    @Param('collaboratorId') collaboratorId: string,
    @CurrentUser() user: User,
    @Body() dto: RespondCollaboratorDto,
  ) {
    return this.bookingsService.respondToCollaboratorInvite(collaboratorId, user, dto);
  }

  @Delete('collaborators/:collaboratorId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Primary vendor cancels a collaborator from this booking' })
  cancelCollaborator(@Param('collaboratorId') collaboratorId: string, @CurrentUser() user: User) {
    return this.bookingsService.cancelCollaborator(collaboratorId, user);
  }
}
