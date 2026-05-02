import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Officer } from '../../entities/officer.entity';

@Injectable()
export class OfficersService {
  constructor(
    @InjectRepository(Officer)
    private officersRepository: Repository<Officer>,
  ) {}

  findAll(): Promise<Officer[]> {
    return this.officersRepository.find();
  }

  findOne(id: string): Promise<Officer> {
    return this.officersRepository.findOne({ where: { id } });
  }

  create(createOfficerDto: any): Promise<Officer> {
    return this.officersRepository.save(createOfficerDto);
  }

  update(id: string, updateOfficerDto: any): Promise<any> {
    return this.officersRepository.update(id, updateOfficerDto);
  }

  updateStatus(id: string, status: string): Promise<any> {
    return this.officersRepository.update(id, { status });
  }
}