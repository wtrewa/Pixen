import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class QuoteCustomRequestDto {
  @ApiProperty({ example: 2500 })
  @IsNumber()
  @Min(0)
  quotedPrice: number;

  @ApiProperty({ example: 'We can arrange this via rental', required: false })
  @IsOptional()
  @IsString()
  vendorResponse?: string;
}
