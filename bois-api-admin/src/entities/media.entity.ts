import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Post } from './post.entity';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  original_name: string;

  @Column({ type: 'varchar', length: 20 })
  file_type: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mime_type: string;

  @Column({ type: 'bigint', nullable: true })
  file_size: number;

  @Column({ type: 'varchar', length: 500 })
  storage_path: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  public_url: string;

  @Column({ type: 'uuid', nullable: true })
  post_id: string;

  @ManyToOne(() => Post, { nullable: true })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ type: 'uuid', nullable: true })
  uploaded_by: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}