import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogsRepository: Repository<AuditLog>,
  ) {}

  async findAll(query: any) {
    const { actor_id, entity, from, to, page = 1, limit = 50 } = query;
    const qb = this.auditLogsRepository.createQueryBuilder('log')
      .leftJoinAndSelect('log.actor', 'actor')
      .orderBy('log.created_at', 'DESC');

    if (actor_id) {
      qb.andWhere('log.actor_id = :actor_id', { actor_id });
    }
    if (entity) {
      qb.andWhere('log.entity = :entity', { entity });
    }
    if (from) {
      qb.andWhere('log.created_at >= :from', { from });
    }
    if (to) {
      qb.andWhere('log.created_at <= :to', { to });
    }

    qb.skip((page - 1) * limit).take(limit);

    return qb.getMany();
  }
}