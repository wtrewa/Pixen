import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { AddonCategory } from '../../../common/enums/addon-category.enum';

export class CreateAddonDto {
  @ApiProperty({ example: 'Drone (DJI Mavic 3 Pro)' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Aerial shots at ceremony and reception', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: AddonCategory })
  @IsEnum(AddonCategory)
  category: AddonCategory;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxQuantity?: number;
}
