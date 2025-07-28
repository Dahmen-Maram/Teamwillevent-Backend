// src/events/events.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/modules/user/api/user.service';
import { Repository } from 'typeorm';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { Event } from 'src/common/models/types/event.entity';
import { EventStatus } from 'src/common/enum/eventStatus.enum';
import { NotificationService } from 'src/modules/notification/api/notification.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
     private readonly notificationService: NotificationService,
  ) {}

  async create(createEventDto: CreateEventDto, userId: string): Promise<Event> {
  const organisateur = await this.userService.findOne(userId);
  if (!organisateur) {
    throw new NotFoundException('Organisateur non trouvé');
  }

  const event = this.eventRepository.create({
    ...createEventDto,
    organisateur,
  });

  const savedEvent = await this.eventRepository.save(event);

  this.eventEmitter.emit('event.created', {
    eventId: savedEvent.id,
    titre: savedEvent.titre,
  });

  // Exemple : Notifier tous les utilisateurs (ou ciblés) sauf l'organisateur
  const usersToNotify = await this.userService.findAllExceptUser(userId);

  for (const user of usersToNotify) {
    await this.notificationService.create(
      user.id,
      `Nouvel événement publié : ${savedEvent.titre}`,
      'event',
      { eventId: savedEvent.id },
    );
  }

  return savedEvent;
}



  async findAll(): Promise<Event[]> {
  try {
    const events = await this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.participants', 'participant')
      .leftJoinAndSelect('event.organisateur', 'organisateur')
      .getMany();

    // Met à jour les statuts si nécessaire
    const updatedEvents = await Promise.all(
      events.map((event) => this.updateEventStatusIfNeeded(event.id))
    );

    return updatedEvents;
  } catch (error) {
    console.error('Error fetching events with relations:', error);
    throw error;
  }
}


async findOne(id: string): Promise<Event> {
  await this.updateEventStatusIfNeeded(id) // 🔁 Met à jour le statut
  const event = await this.eventRepository.findOne({
    where: { id },
    relations: ['participants', 'organisateur'], // ajoute les relations si besoin
  });

  if (!event) {
    throw new NotFoundException('Événement non trouvé');
  }

  return event;
}
  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);
    Object.assign(event, updateEventDto);
    return this.eventRepository.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.eventRepository.remove(event);
  }
  async updateEventStatusIfNeeded(eventId: string): Promise<Event> {
  const event = await this.eventRepository.findOne({
    where: { id: eventId },
  })

  if (!event) throw new NotFoundException("Événement introuvable")

  const now = new Date()
  const eventDateTime = new Date(`${event.date}T${event.heure}`)

  // Vérifier si on doit changer le statut
  if (now >= eventDateTime && event.status !== EventStatus.DONE) {
  event.status = EventStatus.DONE
  return await this.eventRepository.save(event)
}

if (now < eventDateTime && event.status !== EventStatus.PUBLISHED) {
  event.status = EventStatus.PUBLISHED
  return await this.eventRepository.save(event)
}

  return event // pas de mise à jour
}

  // events.service.ts
}
