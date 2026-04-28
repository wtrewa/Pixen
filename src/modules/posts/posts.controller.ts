import { Controller, Get, Post, Delete, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/roles.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Posts & Reels')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('trending')
  @Public()
  @ApiOperation({ summary: 'Get trending reels/posts for discovery feed' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  getTrending(@Query('limit') limit = 10) {
    return this.postsService.getTrending(+limit);
  }

  @Get('vendor/:vendorId')
  @Public()
  @ApiOperation({ summary: 'Get all posts by a vendor' })
  @ApiParam({ name: 'vendorId', description: 'Vendor UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getByVendor(
    @Param('vendorId') vendorId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.postsService.getByVendor(vendorId, +page, +limit);
  }

  @Post()
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Vendor upload new reel/post' })
  createPost(@CurrentUser() user: User, @Body() dto: CreatePostDto) {
    return this.postsService.createPost(user.id, dto);
  }

  @Patch(':id/like')
  @Public()
  @ApiOperation({ summary: 'Like a post' })
  @ApiParam({ name: 'id', description: 'Post UUID' })
  likePost(@Param('id') id: string) {
    return this.postsService.likePost(id);
  }

  @Delete(':id')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Delete own post' })
  @ApiParam({ name: 'id', description: 'Post UUID' })
  deletePost(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postsService.deletePost(id, user.id);
  }
}
