import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Position } from '../../entities/position.entity';
import { Officer } from '../../entities/officer.entity';
import { Post } from '../../entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Position, Officer, Post])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
