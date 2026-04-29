import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateGalleryDto {
  @ApiProperty({ example: 'Smith Wedding' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Final high-resolution delivery' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'uuid-v4-booking-id' })
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ example: 'securepassword123', required: false })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isWatermarked?: boolean;
}
