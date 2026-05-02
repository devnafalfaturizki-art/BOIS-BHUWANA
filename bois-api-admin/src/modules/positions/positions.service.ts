import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from '../../entities/position.entity';

@Injectable()
export class PositionsService {
  constructor(
    @InjectRepository(Position)
    private positionsRepository: Repository<Position>,
  ) {}

  findAll(): Promise<Position[]> {
    return this.positionsRepository.find({
      relations: ['children', 'parent'],
    });
  }

  findOne(id: string): Promise<Position> {
    return this.positionsRepository.findOne({
      where: { id },
      relations: ['children', 'parent'],
    });
  }

  async getHistory(positionId: string) {
    // Placeholder, could join with assignments
    return this.findOne(positionId);
  }

  create(createPositionDto: any): Promise<Position> {
    return this.positionsRepository.save(createPositionDto);
  }

  update(id: string, updatePositionDto: any): Promise<any> {
    return this.positionsRepository.update(id, updatePositionDto);
  }

  deactivate(id: string): Promise<any> {
    return this.positionsRepository.update(id, { is_active: false });
  }
}