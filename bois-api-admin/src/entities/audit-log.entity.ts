import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  actor_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  entity: string;

  @Column({ type: 'uuid', nullable: true })
  entity_id: string;

  @Column({ type: 'jsonb', nullable: true })
  old_value: any;

  @Column({ type: 'jsonb', nullable: true })
  new_value: any;

  @Column({ type: 'inet', nullable: true })
  ip_address: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}