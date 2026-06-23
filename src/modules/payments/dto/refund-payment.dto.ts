import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({ example: 'Vendor unavailable on event date', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
