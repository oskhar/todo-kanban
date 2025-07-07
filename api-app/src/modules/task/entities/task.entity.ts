import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { TaskStatus } from '../enums/task-status.enum';

@Entity({ name: 'tasks' })
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Judul atau deskripsi singkat dari tugas',
  })
  title: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
    comment: 'Status tugas saat ini: todo, progress, atau done',
  })
  status: TaskStatus;

  @CreateDateColumn({
    comment: 'Waktu saat tugas dibuat',
  })
  createdAt: Date;

  @UpdateDateColumn({
    comment: 'Waktu saat tugas terakhir kali diperbarui',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    nullable: true,
    comment: 'Waktu saat tugas dihapus (soft delete)',
  })
  deletedAt?: Date | null;
}
