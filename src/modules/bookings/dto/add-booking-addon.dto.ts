import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, Max, Min } from 'class-validator';

export class AddBookingAddonItemDto {
  @ApiProperty({ example: 'uuid-of-addon' })
  @IsUUID()
  addonId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  @Max(20)
  quantity: number;
}
