import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Officer } from '../../entities/officer.entity';
import { Position } from '../../entities/position.entity';
import { Post } from '../../entities/post.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Position)
    private positionsRepository: Repository<Position>,
    @InjectRepository(Officer)
    private officersRepository: Repository<Officer>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  async search(query: any) {
    const q = (query.q || '').trim();
    const type = query.type || 'all';
    if (!q) {
      return { positions: [], officers: [], posts: [] };
    }

    const results: any = {};

    if (type === 'all' || type === 'positions') {
      results.positions = await this.positionsRepository
        .createQueryBuilder('position')
        .where('position.name ILIKE :q', { q: `%${q}%` })
        .andWhere('position.is_active = true')
        .getMany();
    }

    if (type === 'all' || type === 'officers') {
      results.officers = await this.officersRepository
        .createQueryBuilder('officer')
        .where('officer.full_name ILIKE :q OR officer.nrp ILIKE :q', { q: `%${q}%` })
        .andWhere("officer.status = 'active'")
        .getMany();
    }

    if (type === 'all' || type === 'posts') {
      results.posts = await this.postsRepository
        .createQueryBuilder('post')
        .where('post.status = :status', { status: 'published' })
        .andWhere('post.title ILIKE :q OR post.content ILIKE :q', { q: `%${q}%` })
        .getMany();
    }

    return results;
  }
}
