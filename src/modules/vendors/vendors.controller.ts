import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  HttpCode, HttpStatus, Query, UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { CreateAddonDto } from './dto/create-addon.dto';
import { QueryVendorDto } from './dto/query-vendor.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/roles.enum';
import { User } from '../users/entities/user.entity';
import { Vendor } from './entities/vendor.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Vendors & Marketplace')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}
  
  @Get('metadata/addon-categories')
  @Public()
  @ApiOperation({ summary: 'Get available add-on categories' })
  getAddonCategories() {
    return {
      success: true,
      data: [
        { label: 'Camera / Gear', value: 'CAMERA' },
        { label: 'Drone / Aerial', value: 'DRONE' },
        { label: 'Gimbal / Stab', value: 'GIMBAL' },
        { label: 'Lighting', value: 'LIGHTING' },
        { label: 'Album / Print', value: 'ALBUM' },
        { label: 'Extra Hours', value: 'HOUR' },
        { label: 'Other', value: 'OTHER' },
      ]
    };
  }

  @Get('metadata/equipment-categories')
  @Public()
  @ApiOperation({ summary: 'Get available equipment categories' })
  getEquipmentCategories() {
    return {
      success: true,
      data: [
        { label: 'Camera Body', value: 'CAMERA_BODY' },
        { label: 'Lens', value: 'LENS' },
        { label: 'Drone', value: 'DRONE' },
        { label: 'Gimbal', value: 'GIMBAL' },
        { label: 'Lighting', value: 'LIGHTING' },
        { label: 'Audio', value: 'AUDIO' },
        { label: 'Photobooth', value: 'PHOTOBOOTH' },
        { label: 'Other', value: 'OTHER' },
      ]
    };
  }

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new vendor profile' })
  @ApiResponse({ status: 201, description: 'Vendor profile created', type: Vendor })
  @ApiResponse({ status: 400, description: 'Validation failed or profile already exists' })
  register(@CurrentUser() user: User, @Body() dto: CreateVendorDto) {
    return this.vendorsService.register(user.id, dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all vendors with filtering' })
  @ApiResponse({ status: 200, description: 'List of vendors returned', type: [Vendor] })
  findAll(@Query() query: QueryVendorDto) {
    return this.vendorsService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get specific vendor details' })
  @ApiParam({ name: 'id', description: 'Vendor UUID' })
  @ApiResponse({ status: 200, description: 'Vendor details returned', type: Vendor })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vendor dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Stats returned' })
  getStats(@Param('id') id: string, @CurrentUser() user: User) {
    return this.vendorsService.getStats(id, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update vendor profile information' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: Vendor })
  update(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: UpdateVendorDto) {
    return this.vendorsService.update(id, user.id, dto);
  }

  @Post(':id/services')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new service to the vendor profile' })
  @ApiResponse({ status: 201, description: 'Service added' })
  addService(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: CreateServiceDto) {
    return this.vendorsService.addService(id, user.id, dto);
  }

  @Delete('services/:serviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a service from the profile' })
  @ApiResponse({ status: 204, description: 'Service removed' })
  removeService(@Param('serviceId') serviceId: string, @CurrentUser() user: User) {
    return this.vendorsService.removeService(serviceId, user.id);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify or unverify a vendor (Admin only)' })
  @ApiResponse({ status: 200, description: 'Verification status updated' })
  verify(@Param('id') id: string, @Body('isVerified') isVerified: boolean) {
    return this.vendorsService.verify(id, isVerified);
  }

  @Get(':id/availability')
  @Public()
  @ApiOperation({ summary: 'Get vendor blocked dates for booking' })
  @ApiResponse({ status: 200, description: 'Availability list returned' })
  getAvailability(@Param('id') id: string) {
    return this.vendorsService.getAvailability(id);
  }

  @Post(':id/availability')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Block a specific date (Vendor only)' })
  @ApiResponse({ status: 201, description: 'Date blocked' })
  blockDate(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('date') date: string,
    @Body('reason') reason?: string,
  ) {
    return this.vendorsService.blockDate(id, user.id, date, reason);
  }

  @Delete('availability/:availId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unblock a date' })
  @ApiResponse({ status: 204, description: 'Date unblocked' })
  unblockDate(@Param('availId') availId: string, @CurrentUser() user: User) {
    return this.vendorsService.unblockDate(availId, user.id);
  }

  // ── Equipment Catalog ──────────────────────────────────────────────────────

  @Get(':id/equipment')
  @Public()
  @ApiOperation({ summary: 'Get vendor equipment catalog (public)' })
  getEquipment(@Param('id') id: string) {
    return this.vendorsService.getEquipment(id);
  }

  @Post(':id/equipment')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add equipment to vendor catalog' })
  addEquipment(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: CreateEquipmentDto) {
    return this.vendorsService.addEquipment(id, user.id, dto);
  }

  @Patch('equipment/:equipmentId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an equipment entry' })
  updateEquipment(
    @Param('equipmentId') equipmentId: string,
    @CurrentUser() user: User,
    @Body() dto: Partial<CreateEquipmentDto>,
  ) {
    return this.vendorsService.updateEquipment(equipmentId, user.id, dto);
  }

  @Delete('equipment/:equipmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove equipment from catalog' })
  removeEquipment(@Param('equipmentId') equipmentId: string, @CurrentUser() user: User) {
    return this.vendorsService.removeEquipment(equipmentId, user.id);
  }

  // ── Service Add-ons ────────────────────────────────────────────────────────

  @Get(':id/addons')
  @Public()
  @ApiOperation({ summary: 'Get available add-ons for this vendor (public)' })
  getAddons(@Param('id') id: string) {
    return this.vendorsService.getAddons(id);
  }

  @Post(':id/addons')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new bookable add-on' })
  addAddon(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: CreateAddonDto) {
    return this.vendorsService.addAddon(id, user.id, dto);
  }

  @Patch('addons/:addonId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an add-on (price, name, active status)' })
  updateAddon(
    @Param('addonId') addonId: string,
    @CurrentUser() user: User,
    @Body() dto: Partial<CreateAddonDto>,
  ) {
    return this.vendorsService.updateAddon(addonId, user.id, dto);
  }

  @Delete('addons/:addonId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @Roles(Role.VENDOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an add-on' })
  removeAddon(@Param('addonId') addonId: string, @CurrentUser() user: User) {
    return this.vendorsService.removeAddon(addonId, user.id);
  }
}
