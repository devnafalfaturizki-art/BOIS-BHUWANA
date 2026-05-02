import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Officer } from '../../entities/officer.entity';
import { Assignment } from '../../entities/assignment.entity';

@Injectable()
export class OfficersService {
  constructor(
    @InjectRepository(Officer)
    private officersRepository: Repository<Officer>,
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
  ) {}

  findAll(): Promise<Officer[]> {
    return this.officersRepository.find({
      where: { status: 'active' },
    });
  }

  findOne(id: string): Promise<Officer> {
    return this.officersRepository.findOne({
      where: { id, status: 'active' },
    });
  }

  async getAssignments(officerId: string) {
    return this.assignmentsRepository.find({
      where: { officer_id: officerId },
      relations: ['position'],
      order: { start_date: 'DESC' },
    });
  }
}