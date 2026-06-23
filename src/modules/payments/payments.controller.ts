import { Controller, Get, Post, Body, Param, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate payment order' })
  initiate(@CurrentUser() user: User, @Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiate(user.id, dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify payment from client' })
  verify(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verify(dto);
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Razorpay webhook (internal)' })
  webhook(@Req() req: Request) {
    return this.paymentsService.handleWebhook(req);
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get payments for a booking' })
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.paymentsService.findByBooking(bookingId);
  }

  @Post('refund/:bookingId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refund all successful payments for a booking (admin only)' })
  refund(@Param('bookingId') bookingId: string, @Body() dto: RefundPaymentDto) {
    return this.paymentsService.refund(bookingId, dto);
  }
}
