import {
  Controller, Get, Post, Body, Param, Delete,
  HttpCode, HttpStatus, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/roles.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('Portfolios')
@ApiBearerAuth()
@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Post()
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Create portfolio' })
  create(@CurrentUser() user: User, @Body() dto: CreatePortfolioDto) {
    return this.portfoliosService.create(user.id, dto);
  }

  @Get('vendor/:vendorId')
  @Public()
  @ApiOperation({ summary: 'Get vendor portfolios (public)' })
  findByVendor(@Param('vendorId') vendorId: string) {
    return this.portfoliosService.findByVendor(vendorId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get portfolio details (public)' })
  findOne(@Param('id') id: string) {
    return this.portfoliosService.findOne(id);
  }

  @Post(':id/media')
  @Roles(Role.VENDOR)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload media to portfolio' })
  @UseInterceptors(FileInterceptor('file'))
  uploadMedia(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.portfoliosService.uploadMedia(id, user.id, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Delete portfolio' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.portfoliosService.remove(id, user.id);
  }
}
