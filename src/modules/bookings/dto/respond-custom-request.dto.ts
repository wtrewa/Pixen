import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CustomRequestStatus } from '../../../common/enums/custom-request-status.enum';

export class RespondCustomRequestDto {
  @ApiProperty({ enum: [CustomRequestStatus.ACCEPTED, CustomRequestStatus.REJECTED] })
  @IsEnum([CustomRequestStatus.ACCEPTED, CustomRequestStatus.REJECTED])
  status: CustomRequestStatus.ACCEPTED | CustomRequestStatus.REJECTED;
}
