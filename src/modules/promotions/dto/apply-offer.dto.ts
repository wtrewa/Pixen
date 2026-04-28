import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ApplyOfferDto {
  @ApiProperty({ example: 'WELCOME20' })
  @IsString()
  code: string;
}
