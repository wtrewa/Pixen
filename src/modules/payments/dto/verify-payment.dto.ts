import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  razorpayOrderId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  razorpayPaymentId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  razorpaySignature?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  cashfreeOrderId?: string;
}
