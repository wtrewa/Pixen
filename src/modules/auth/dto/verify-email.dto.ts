import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'abc123token...' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
