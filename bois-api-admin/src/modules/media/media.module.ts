import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from '../../entities/media.entity';
import { Post } from '../../entities/post.entity';
import { User } from '../../entities/user.entity';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [TypeOrmModule.forFeature([Media, Post, User])],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
