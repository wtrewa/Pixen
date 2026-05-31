import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { VendorsModule } from '../vendors/vendors.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    VendorsModule,
    StorageModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
