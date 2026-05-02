import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Officer } from '../../entities/officer.entity';
import { Position } from '../../entities/position.entity';
import { Post } from '../../entities/post.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Officer)
    private officersRepository: Repository<Officer>,
    @InjectRepository(Position)
    private positionsRepository: Repository<Position>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  async search(query: string, type: string = 'all') {
    const results = { officers: [], positions: [], posts: [] };

    if (type === 'all' || type === 'officers') {
      results.officers = await this.officersRepository
        .createQueryBuilder('officer')
        .where('officer.status = :status', { status: 'active' })
        .andWhere('(officer.full_name ILIKE :query OR officer.nrp ILIKE :query OR officer.rank ILIKE :query)')
        .setParameters({ query: `%${query}%` })
        .getMany();
    }

    if (type === 'all' || type === 'positions') {
      results.positions = await this.positionsRepository
        .createQueryBuilder('position')
        .where('position.is_active = true')
        .andWhere('(position.name ILIKE :query OR position.code ILIKE :query)')
        .setParameters({ query: `%${query}%` })
        .getMany();
    }

    if (type === 'all' || type === 'posts') {
      results.posts = await this.postsRepository
        .createQueryBuilder('post')
        .where('post.status = :status', { status: 'published' })
        .andWhere('(post.title ILIKE :query OR post.content ILIKE :query)')
        .setParameters({ query: `%${query}%` })
        .getMany();
    }

    return results;
  }
}