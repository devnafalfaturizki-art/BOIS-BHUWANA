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

  findAll(): Promise<Post[]> {
    return this.postsRepository.find({ order: { created_at: 'DESC' } });
  }

  findOne(id: string): Promise<Post> {
    return this.postsRepository.findOne({ where: { id } });
  }

  create(createPostDto: any): Promise<Post> {
    return this.postsRepository.save(createPostDto);
  }

  update(id: string, updatePostDto: any): Promise<any> {
    return this.postsRepository.update(id, updatePostDto);
  }

  publish(id: string): Promise<any> {
    return this.postsRepository.update(id, { status: 'published', published_at: new Date() });
  }

  archive(id: string): Promise<any> {
    return this.postsRepository.update(id, { status: 'archived' });
  }

  remove(id: string): Promise<any> {
    return this.postsRepository.update(id, { status: 'archived' }); // Soft delete
  }
}