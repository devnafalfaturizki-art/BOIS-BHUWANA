import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: string): Promise<User> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(createUserDto: any): Promise<User> {
    if (!createUserDto.username || !createUserDto.email || !createUserDto.password_hash) {
      throw new BadRequestException('username, email, and password_hash are required');
    }
    return this.usersRepository.save(createUserDto);
  }

  update(id: string, updateUserDto: any): Promise<any> {
    return this.usersRepository.update(id, updateUserDto);
  }

  deactivate(id: string): Promise<any> {
    return this.usersRepository.update(id, { is_active: false });
  }
}
