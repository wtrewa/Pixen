import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GalleriesService } from './galleries.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('galleries')
@Controller('galleries')
export class GalleriesController {
  constructor(private readonly galleriesService: GalleriesService) {}

  @Post()
  @Roles(Role.VENDOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new digital gallery' })
  create(@Request() req, @Body() dto: CreateGalleryDto) {
    return this.galleriesService.create(req.user.vendorId || req.user.id, dto);
  }

  @Post(':id/access')
  @Public()
  @ApiOperation({ summary: 'Authenticate access to a protected gallery' })
  authenticate(@Param('id') id: string, @Body('password') password?: string) {
    return this.galleriesService.validateAccess(id, password);
  }

  @Get(':id')
  @Public() // Accessible if token is valid or gallery is public
  @ApiOperation({ summary: 'Fetch gallery details and media' })
  findOne(@Param('id') id: string) {
    return this.galleriesService.findOne(id);
  }

  @Post(':id/upload-urls')
  @Roles(Role.VENDOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request pre-signed URLs for media upload' })
  getUploadUrls(@Request() req, @Param('id') id: string, @Body('count') count: number) {
    return this.galleriesService.getUploadUrls(req.user.vendorId || req.user.id, id, count);
  }

  @Post(':id/confirm-uploads')
  @Roles(Role.VENDOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm completed uploads' })
  confirmUploads(@Request() req, @Param('id') id: string, @Body('media') media: any[]) {
    return this.galleriesService.confirmUploads(req.user.vendorId || req.user.id, id, media);
  }
}
