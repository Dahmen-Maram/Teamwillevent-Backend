import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

import { BaseModel } from '../base-model';
import { UserRole } from 'src/common/enum/role.enum';
import { Participant } from './participant.entity';
import { Event } from './event.entity';

@Entity()
export class User extends BaseModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @Column({ unique: true })
  email: string;

  @Column()
  motDePasse: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.EMPLOYEE,
  })
  role: UserRole;
  @Column({ nullable: false })
  phone: string;
  @Column({ nullable: false })
  department: string;

  @Column({ nullable: false })
  position: string;

  @Column({ nullable: false })
  location: string;
  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: false })
  address: string;
  // Full postal address
  // ✅ PARTICIPATIONS (inscriptions à des événements)
  @OneToMany(() => Participant, (participant) => participant.user)
  participations: Participant[];

  // ✅ ORGANISATION (événements que j’organise)
  @OneToMany(() => Event, (event) => event.organisateur)
  organizingEvents: Event[];

  @Column({ default: true })
  isEmailConfirmed: boolean;
  @Column({ nullable: true })
resetToken?: string;

@Column({ type: 'timestamp', nullable: true })
resetTokenExpires?: Date;

}
