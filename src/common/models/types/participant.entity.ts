import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';

import { ParticipantStatus } from 'src/common/enum/participantStatus.enum';
import { User } from './user.entity';
import { Event } from './event.entity';

@Entity()
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.participations, { eager: true })
user: User;


  @ManyToOne(() => Event, event => event.participants, { onDelete: 'CASCADE' })
event: Event;


  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.PENDING,
  })
  status: ParticipantStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  registeredAt: Date;
}
