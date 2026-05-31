import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { BookingType } from '../../../common/enums/booking-type.enum';
import { AddBookingAddonItemDto } from './add-booking-addon.dto';

export class EventDateItemDto {
  @ApiProperty({ example: '2026-12-10' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Tilak' })
  @IsString()
  @IsNotEmpty()
  label: string;
}

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  vendorId: string;

  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiProperty({ enum: BookingType, default: BookingType.HOURLY })
  @IsEnum(BookingType)
  bookingType: BookingType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  eventLocation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  // ── HOURLY fields ──────────────────────────────────────────────────────────
  @ApiProperty({
    example: '2026-12-15T14:00:00Z',
    description: 'Start date + time (required for HOURLY)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiProperty({
    example: 2,
    description: 'Duration in hours (required for HOURLY)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(24)
  durationHours?: number;

  // ── MULTI_DATE fields ──────────────────────────────────────────────────────
  @ApiProperty({
    required: false,
    description: 'Individual dates with ceremony labels (required for MULTI_DATE)',
    example: [
      { date: '2026-12-10', label: 'Tilak' },
      { date: '2026-12-15', label: 'Engagement' },
      { date: '2026-12-18', label: 'Marriage' },
    ],
    type: [EventDateItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventDateItemDto)
  eventDates?: EventDateItemDto[];

  // ── DATE_RANGE fields ──────────────────────────────────────────────────────
  @ApiProperty({
    example: '2026-12-15',
    description: 'First day of booking range (required for DATE_RANGE)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    example: '2026-12-18',
    description: 'Last day of booking range (required for DATE_RANGE)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // ── Add-ons ────────────────────────────────────────────────────────────────
  @ApiProperty({
    required: false,
    description: 'Optional add-ons to attach to this booking',
    example: [{ addonId: 'uuid', quantity: 1 }],
    type: [AddBookingAddonItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddBookingAddonItemDto)
  addons?: AddBookingAddonItemDto[];

  // ── Custom requests ────────────────────────────────────────────────────────
  @ApiProperty({
    required: false,
    description: 'Free-text extra requests for the vendor to quote on',
    example: ['I also want a smoke machine and confetti cannon'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customRequests?: string[];

  // ── Promo code ─────────────────────────────────────────────────────────────
  @ApiProperty({
    required: false,
    description: 'Optional promo code to apply a discount',
    example: 'PIXEN20',
  })
  @IsOptional()
  @IsString()
  promoCode?: string;
}