import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from '../../entities/media.entity';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {}

  findAll(): Promise<Media[]> {
    return this.mediaRepository.find({ order: { created_at: 'DESC' } });
  }

  upload(createMediaDto: any): Promise<Media> {
    return this.mediaRepository.save(createMediaDto);
  }

  async remove(id: string): Promise<{ message: string }> {
    const media = await this.mediaRepository.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    await this.mediaRepository.delete(id);
    return { message: 'Media deleted' };
  }
}
