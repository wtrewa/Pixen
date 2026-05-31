import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCustomRequestDto {
  @ApiProperty({ example: 'I also want a smoke machine and confetti cannon for the ceremony' })
  @IsNotEmpty()
  @IsString()
  description: string;
}
