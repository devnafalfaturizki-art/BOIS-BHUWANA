import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Position } from './entities/position.entity';
import { Officer } from './entities/officer.entity';
import { Post } from './entities/post.entity';
import { Assignment } from './entities/assignment.entity';
import { PositionsModule } from './modules/positions/positions.module';
import { OfficersModule } from './modules/officers/officers.module';
import { PostsModule } from './modules/posts/posts.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Position, Officer, Post, Assignment],
      synchronize: true, // For development only
    }),
    PositionsModule,
    OfficersModule,
    PostsModule,
    SearchModule,
  ],
})
export class AppModule {}