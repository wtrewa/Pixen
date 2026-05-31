import { Controller, Post, Get, Body, Param, UseGuards, Request, ForbiddenException, Res } from '@nestjs/common';
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
  async create(@Request() req, @Body() dto: CreateGalleryDto) {
    const vendorId = req.user.vendorId || req.user.vendor?.id;
    
    if (!vendorId) {
      throw new ForbiddenException('Vendor profile required to create a gallery');
    }
    
    return this.galleriesService.create(vendorId, dto);
  }

  @Get('my')
  @Roles(Role.VENDOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List vendor galleries' })
  async findMyGalleries(@Request() req) {
    const vendorId = req.user.vendorId || req.user.vendor?.id;
    if (!vendorId) throw new ForbiddenException('Vendor profile required');
    return this.galleriesService.findByVendor(vendorId);
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
  getUploadUrls(@Request() req, @Param('id') id: string, @Body('files') files: { name: string; type: string }[]) {
    return this.galleriesService.getUploadUrls(req.user.vendorId || req.user.id, id, files);
  }

  @Post(':id/confirm-uploads')
  @Roles(Role.VENDOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm completed uploads' })
  confirmUploads(@Request() req, @Param('id') id: string, @Body('media') media: any[]) {
    return this.galleriesService.confirmUploads(req.user.vendorId || req.user.id, id, media);
  }

  @Public()
  @Get(':id/qr')
  @ApiOperation({ summary: 'Get gallery access QR code (Proxied)' })
  async getQrCode(@Param('id') id: string, @Res() res: any) {
    const url = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/gallery/${id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`;
    
    try {
      const response = await fetch(qrUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) throw new Error(`QR Provider responded with ${response.status}`);
      
      const arrayBuffer = await response.arrayBuffer();
      res.set('Content-Type', 'image/png');
      res.set('Cache-Control', 'public, max-age=3600');
      return res.send(Buffer.from(arrayBuffer));
    } catch (error: any) {
      console.error('QR Proxy Error:', error.message);
      return res.status(500).send('Failed to generate QR code: ' + error.message);
    }
  }
}
