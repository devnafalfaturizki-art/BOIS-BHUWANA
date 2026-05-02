import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Position } from './entities/position.entity';
import { Officer } from './entities/officer.entity';
import { Post } from './entities/post.entity';
import { Assignment } from './entities/assignment.entity';
import { Media } from './entities/media.entity';
import { User } from './entities/user.entity';
import { AuditLog } from './entities/audit-log.entity';
import { AuthModule } from './modules/auth/auth.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { PositionsModule } from './modules/positions/positions.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Position, Officer, Post, Assignment, Media, User, AuditLog],
      synchronize: true, // For development only
    }),
    AuthModule,
    AssignmentsModule,
    PositionsModule,
  ],
})
export class AppModule {}