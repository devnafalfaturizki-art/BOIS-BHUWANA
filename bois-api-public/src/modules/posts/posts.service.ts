import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../../entities/post.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  async findAll(query: any) {
    const { category, year, page = 1, limit = 10 } = query;
    const qb = this.postsRepository.createQueryBuilder('post')
      .where('post.status = :status', { status: 'published' })
      .orderBy('post.published_at', 'DESC');

    if (category) {
      qb.andWhere('post.category = :category', { category });
    }
    if (year) {
      qb.andWhere('EXTRACT(YEAR FROM post.published_at) = :year', { year: parseInt(year) });
    }

    qb.skip((page - 1) * limit).take(limit);

    return qb.getMany();
  }

  findOne(slug: string): Promise<Post> {
    return this.postsRepository.findOne({
      where: { slug, status: 'published' },
    });
  }
}