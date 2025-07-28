// src/participants/participants.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Participant } from 'src/common/models/types/participant.entity';
import { EventsService } from 'src/modules/event/api/event.service';
import { UserService } from 'src/modules/user/api/user.service';
import { Repository } from 'typeorm';
import { CreateParticipantDto } from '../dto/create-participant.dto';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantRepo: Repository<Participant>,
    private readonly userService: UserService,
    private readonly eventsService: EventsService,
  ) {}

  async create(dto: CreateParticipantDto): Promise<Participant> {
    const user = await this.userService.findOne(dto.userId);
    const event = await this.eventsService.findOne(dto.eventId);

    if (!user || !event)
      throw new NotFoundException('Utilisateur ou événement non trouvé');

    const existing = await this.participantRepo.findOne({
      where: { user: { id: dto.userId }, event: { id: dto.eventId } },
    });

    if (existing) throw new Error('Utilisateur déjà inscrit à cet événement');

    const participant = this.participantRepo.create({ user, event });
    return this.participantRepo.save(participant);
  }

  async findAll(): Promise<Participant[]> {
    return this.participantRepo.find();
  }

  async findByEvent(eventId: string): Promise<Participant[]> {
    return this.participantRepo.find({ where: { event: { id: eventId } } });
  }

  async remove(id: string): Promise<void> {
    const participant = await this.participantRepo.findOne({ where: { id } });
    if (!participant) throw new NotFoundException('Participant non trouvé');
    await this.participantRepo.remove(participant);
  }
  async removeByEventAndUser(eventId: string, userId: string): Promise<void> {
  const participant = await this.participantRepo.findOne({
    where: {
      event: { id: eventId },
      user: { id: userId },
    },
  })

  if (!participant) {
    throw new NotFoundException('Inscription non trouvée pour cet utilisateur et événement')
  }

  await this.participantRepo.remove(participant)
}

}
