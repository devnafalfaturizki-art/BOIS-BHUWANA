import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private auditLogsRepository: Repository<AuditLog>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (user && await bcrypt.compare(password, user.password_hash)) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any, ip: string, userAgent: string) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Update last login
    await this.usersRepository.update(user.id, { last_login_at: new Date() });

    // Log login
    await this.auditLogsRepository.save({
      actor_id: user.id,
      action: 'LOGIN',
      entity: 'user',
      entity_id: user.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    return {
      access_token: accessToken,
      user,
    };
  }

  async logout(userId: string, ip: string) {
    await this.auditLogsRepository.save({
      actor_id: userId,
      action: 'LOGOUT',
      entity: 'user',
      entity_id: userId,
      ip_address: ip,
    });
  }
}