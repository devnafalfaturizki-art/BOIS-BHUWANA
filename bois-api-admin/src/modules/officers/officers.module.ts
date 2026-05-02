import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Officer } from '../../entities/officer.entity';
import { OfficersController } from './officers.controller';
import { OfficersService } from './officers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Officer])],
  controllers: [OfficersController],
  providers: [OfficersService],
})
export class OfficersModule {}