import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Assignment } from '../../entities/assignment.entity';
import { Officer } from '../../entities/officer.entity';
import { Position } from '../../entities/position.entity';
import { User } from '../../entities/user.entity';
import { AuditLog } from '../../entities/audit-log.entity';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
    @InjectRepository(Officer)
    private officersRepository: Repository<Officer>,
    @InjectRepository(Position)
    private positionsRepository: Repository<Position>,
    @InjectRepository(AuditLog)
    private auditLogsRepository: Repository<AuditLog>,
    private dataSource: DataSource,
  ) {}

  async findActive() {
    return this.assignmentsRepository.find({
      where: { end_date: null },
      relations: ['officer', 'position'],
    });
  }

  async findHistory() {
    return this.assignmentsRepository.find({
      relations: ['officer', 'position'],
      order: { created_at: 'DESC' },
    });
  }

  async create(createAssignmentDto: any, userId: string) {
    const { officer_id, position_id, start_date, notes } = createAssignmentDto;

    // Validate officer and position exist
    const officer = await this.officersRepository.findOne({ where: { id: officer_id } });
    const position = await this.positionsRepository.findOne({ where: { id: position_id } });
    if (!officer || !position) {
      throw new BadRequestException('Invalid officer or position');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find current active assignment for this position
      const currentAssignment = await queryRunner.manager.findOne(Assignment, {
        where: { position_id, end_date: null },
      });

      if (currentAssignment) {
        // Close current assignment
        await queryRunner.manager.update(Assignment, currentAssignment.id, {
          end_date: new Date(start_date.getTime() - 86400000), // 1 day before
        });
      }

      // Create new assignment
      const newAssignment = await queryRunner.manager.save(Assignment, {
        officer_id,
        position_id,
        start_date,
        notes,
        created_by: userId,
      });

      // Log audit
      await queryRunner.manager.save(AuditLog, {
        actor_id: userId,
        action: 'CREATE',
        entity: 'assignment',
        entity_id: newAssignment.id,
        new_value: newAssignment,
      });

      await queryRunner.commitTransaction();
      return newAssignment;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async close(id: string, userId: string) {
    const assignment = await this.assignmentsRepository.findOne({ where: { id } });
    if (!assignment || assignment.end_date) {
      throw new BadRequestException('Assignment not found or already closed');
    }

    await this.assignmentsRepository.update(id, { end_date: new Date() });

    // Log audit
    await this.auditLogsRepository.save({
      actor_id: userId,
      action: 'UPDATE',
      entity: 'assignment',
      entity_id: id,
      old_value: { end_date: null },
      new_value: { end_date: new Date() },
    });

    return { message: 'Assignment closed' };
  }
}