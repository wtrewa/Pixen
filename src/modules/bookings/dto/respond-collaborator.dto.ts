import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CollaboratorStatus } from '../../../common/enums/collaborator-status.enum';

export class RespondCollaboratorDto {
  @ApiProperty({ enum: [CollaboratorStatus.ACCEPTED, CollaboratorStatus.REJECTED] })
  @IsEnum([CollaboratorStatus.ACCEPTED, CollaboratorStatus.REJECTED])
  status: CollaboratorStatus.ACCEPTED | CollaboratorStatus.REJECTED;
}
