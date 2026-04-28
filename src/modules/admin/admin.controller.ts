import { Controller, Get, Patch, Param, Req, Query, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { VendorsService } from '../vendors/vendors.service';
import { QueryVendorDto } from '../vendors/dto/query-vendor.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/roles.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly vendorsService: VendorsService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Platform stats' })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('vendors')
  @ApiOperation({ summary: 'List all vendors including unverified (Admin only)' })
  listVendors(@Query() query: QueryVendorDto) {
    return this.vendorsService.findAllForAdmin(query);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Audit logs' })
  getAuditLogs(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.getAuditLogs(+page, +limit);
  }

  @Patch('users/:id/toggle-status')
  @ApiOperation({ summary: 'Activate/deactivate user' })
  toggleUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: User,
    @Req() req: Request,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string);
    return this.adminService.toggleUserStatus(id, admin.id, ip);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Permanently delete user' })
  deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: User,
    @Req() req: Request,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string);
    return this.adminService.deleteUser(id, admin.id, ip);
  }

  @Delete('vendors/:id')
  @ApiOperation({ summary: 'Delete vendor profile' })
  deleteVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: User,
    @Req() req: Request,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string);
    return this.adminService.deleteVendor(id, admin.id, ip);
  }

  @Get('vendors/:id/earnings')
  @ApiOperation({ summary: 'Get vendor earning report' })
  getEarnings(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getVendorEarnings(id);
  }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Delete a review' })
  deleteReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: User,
    @Req() req: Request,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string);
    return this.adminService.deleteReview(id, admin.id, ip);
  }
}
