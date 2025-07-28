// src/events/entities/event.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Participant } from './participant.entity';
import { User } from './user.entity';

import { EventStatus } from 'src/common/enum/eventStatus.enum';
import { Message } from './message.entity';

@Entity()
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titre: string;

  @Column()
  description: string;
  @Column({ type: 'date' })
  date: string;
  @Column({ type: 'time', nullable: true }) 
  heure: string;

  @Column()
  lieu: string;

  @Column()
  capacite: number;

  @ManyToOne(() => User, (user) => user.participations, {
    onDelete: 'CASCADE',
  })
  organisateur: User;

 @OneToMany(() => Participant, participant => participant.event)
  participants: Participant[];
@OneToMany(() => Message, (message) => message.event)
messages: Message[];

 @Column({ nullable: true })
  status:EventStatus;
  @Column({ nullable: true })
  imageUrl: string;
}
