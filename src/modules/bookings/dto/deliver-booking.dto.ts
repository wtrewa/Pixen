import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl, IsString } from 'class-validator';

export class DeliverBookingDto {
  @ApiProperty({ 
    example: 'https://pixen.gallery/wedding-collection-123', 
    description: 'The link to the final edited photos/videos' 
  })
  @IsNotEmpty()
  @IsUrl()
  deliveryLink: string;

  @ApiProperty({ 
    example: 'Enjoy your beautiful memories! All high-res files are in the folder.', 
    required: false 
  })
  @IsString()
  notes?: string;
}
