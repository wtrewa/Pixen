import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { BookingType } from '../../../common/enums/booking-type.enum';

export class CreateServiceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ required: false, description: 'Duration in hours' })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({ enum: BookingType, default: BookingType.HOURLY })
  @IsOptional()
  @IsEnum(BookingType)
  bookingType?: BookingType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  minHours?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxHours?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxDates?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxDays?: number;
}
