import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  code: string;

  @Column({ type: 'uuid', nullable: true })
  parent_id: string;

  @ManyToOne(() => Position, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Position;

  @OneToMany(() => Position, (position) => position.parent)
  children: Position[];

  @Column({ type: 'int', default: 0 })
  level: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}