import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsUrl, IsOptional } from 'class-validator';
import { PostType } from '../entities/post.entity';

export class CreatePostDto {
  @ApiProperty({ enum: PostType, example: PostType.VIDEO })
  @IsEnum(PostType)
  type: PostType;

  @ApiProperty({ example: 'https://cdn.example.com/video.mp4' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ example: 'Traditional Telugu Wedding Ceremony' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ example: 'Indian Wedding' })
  @IsOptional()
  @IsString()
  category?: string;
}
