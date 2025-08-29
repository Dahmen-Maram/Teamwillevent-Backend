// src/common/models/types/task.entity.ts
import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Event } from './event.entity';
import { User } from './user.entity';
import { TaskStatus } from 'src/common/enum/task-status.enum';

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;
  

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Event, event => event.tasks)
  event: Event;

  @ManyToOne(() => User)
  assignedTo: User;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.PENDING })
  status: TaskStatus;
   @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  @Column({ type: 'boolean', default: false })
  isDone: boolean;
}
