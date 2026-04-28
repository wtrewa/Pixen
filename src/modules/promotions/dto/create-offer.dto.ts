import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsEnum, IsNumber, IsOptional, IsDateString, IsInt, Min,
} from 'class-validator';
import { OfferTarget, DiscountType } from '../entities/offer.entity';

export class CreateOfferDto {
  @ApiProperty({ example: 'WELCOME20' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Welcome Discount' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: '20% off on your first booking' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: OfferTarget, example: OfferTarget.CUSTOMER })
  @IsEnum(OfferTarget)
  target: OfferTarget;

  @ApiProperty({ enum: DiscountType, example: DiscountType.PERCENTAGE })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ example: 100, description: '0 = unlimited' })
  @IsOptional()
  @IsInt()
  @Min(0)
  usageLimit?: number;
}
