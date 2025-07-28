import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Event } from './event.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @Column({ nullable: true })
  mediaUrl: string;

  @ManyToOne(() => User, { eager: true })
  sender: User;

  @ManyToOne(() => Event, event => event.messages, { onDelete: 'CASCADE' })
  event: Event;

  @CreateDateColumn()
  timestamp: Date;
  // ✅ Nouveaux champs
  @Column({ default: false })
  deletedForAll: boolean;

  @Column('simple-array', { default: '' })
  deletedForUserIds: string[]; // liste d’IDs utilisateurs

  @Column('simple-array', { default: '' })
  seenBy: string[];
}
