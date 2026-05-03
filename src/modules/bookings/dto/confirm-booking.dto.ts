import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class ConfirmBookingDto {
  @ApiProperty({ example: 15000, description: 'Advance amount required to secure the date' })
  @IsNumber()
  @Min(1)
  advanceAmount: number;
}
