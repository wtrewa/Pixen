import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { EquipmentCategory } from '../../../common/enums/equipment-category.enum';

export class CreateEquipmentDto {
  @ApiProperty({ example: 'Sony A7S III' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Sony', required: false })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ example: 'A7S III', required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ enum: EquipmentCategory })
  @IsEnum(EquipmentCategory)
  category: EquipmentCategory;

  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiProperty({ example: '4K 120fps, excellent low-light', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
