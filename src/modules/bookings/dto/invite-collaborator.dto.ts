import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class InviteCollaboratorDto {
  @ApiProperty({ example: 'uuid-of-collaborator-vendor' })
  @IsUUID()
  collaboratorVendorId: string;

  @ApiProperty({ example: 'Drone Operator' })
  @IsNotEmpty()
  @IsString()
  role: string;

  @ApiProperty({ example: 8000, description: 'Fee you will pay the collaborator' })
  @IsNumber()
  @Min(0)
  agreedFee: number;

  @ApiProperty({ example: 'Handle aerial shots at ceremony and reception', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
