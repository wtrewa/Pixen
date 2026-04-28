import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateVendorDto {
  @ApiProperty({ 
    example: 'The Wedding Frame', 
    description: 'The official name of the photography business',
    minLength: 3
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  businessName: string;

  @ApiProperty({ 
    example: 'Luxury wedding photography and cinematography service.', 
    required: false 
  })
  @IsOptional()
  @IsString()
  businessDescription?: string;

  @ApiProperty({ 
    example: 'Photographer', 
    description: 'Category of service provided'
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: 'India', default: 'India' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: '123, Marine Drive, Mumbai', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 2, description: 'Number of teams available simultaneously', required: false })
  @IsOptional()
  teamCount?: number;
}
