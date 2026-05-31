import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { VendorsRepository } from '../vendors/vendors.repository';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import { PostType } from './entities/post.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private readonly postRepo: Repository<Post>,
    private readonly vendorsRepository: VendorsRepository,
    private readonly storageService: StorageService,
  ) {}

  async getTrending(limit = 10) {
    return this.postRepo.find({
      order: { likesCount: 'DESC', createdAt: 'DESC' },
      take: limit,
      relations: ['vendor'],
    });
  }

  async getByVendor(vendorId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.postRepo.findAndCount({
      where: { vendorId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return buildPaginatedResult(data, total, page, limit);
  }

  async createPost(userId: string, dto: CreatePostDto) {
    const vendor = await this.vendorsRepository.findByUserId(userId);
    const post = this.postRepo.create({ 
      ...dto, 
      userId,
      vendorId: vendor?.id 
    });
    return this.postRepo.save(post);
  }

  async uploadPost(userId: string, file: Express.Multer.File, caption?: string, category?: string) {
    const vendor = await this.vendorsRepository.findByUserId(userId);

    const type = file.mimetype.startsWith('video/') ? PostType.VIDEO : PostType.IMAGE;
    const url = await this.storageService.upload(file, 'posts');

    const post = this.postRepo.create({
      userId,
      vendorId: vendor?.id,
      type,
      url,
      caption,
      category,
    });

    return this.postRepo.save(post);
  }

  async likePost(postId: string) {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    await this.postRepo.increment({ id: postId }, 'likesCount', 1);
    return { success: true };
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    
    if (post.userId !== userId) throw new ForbiddenException('Not your post');
    
    await this.postRepo.remove(post);
    return { message: 'Post deleted' };
  }
}
