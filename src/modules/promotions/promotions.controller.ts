import { Controller, Get, Post, Delete, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { ApplyOfferDto } from './dto/apply-offer.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/roles.enum';
import { OfferTarget } from './entities/offer.entity';

@ApiTags('Promotions')
@ApiBearerAuth()
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new offer code (Admin)' })
  create(@Body() dto: CreateOfferDto) {
    return this.promotionsService.create({
      ...dto,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
    });
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all offers' })
  @ApiQuery({ name: 'target', enum: OfferTarget, required: false })
  findAll(@Query('target') target?: OfferTarget) {
    return this.promotionsService.findAll(target);
  }

  @Post('validate')
  @Public()
  @ApiOperation({ summary: 'Validate an offer code and get discount details' })
  validate(@Body() dto: ApplyOfferDto) {
    return this.promotionsService.validateCode(dto.code);
  }

  @Patch(':id/toggle')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Toggle offer active/inactive (Admin)' })
  toggle(@Param('id') id: string) {
    return this.promotionsService.toggleStatus(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete an offer (Admin)' })
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }
}
