import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from '../../entities/position.entity';
import { Assignment } from '../../entities/assignment.entity';

@Injectable()
export class PositionsService {
  constructor(
    @InjectRepository(Position)
    private positionsRepository: Repository<Position>,
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
  ) {}

  findAll(): Promise<Position[]> {
    return this.positionsRepository.find({
      relations: ['children', 'parent'],
      where: { is_active: true },
    });
  }

  findOne(id: string): Promise<Position> {
    return this.positionsRepository.findOne({
      where: { id, is_active: true },
      relations: ['children', 'parent'],
    });
  }

  async getCurrentOfficer(positionId: string) {
    const assignment = await this.assignmentsRepository.findOne({
      where: { position_id: positionId, end_date: null },
      relations: ['officer'],
    });
    return assignment?.officer || null;
  }

  async getHistory(positionId: string) {
    return this.assignmentsRepository.find({
      where: { position_id: positionId },
      relations: ['officer'],
      order: { start_date: 'DESC' },
    });
  }
}