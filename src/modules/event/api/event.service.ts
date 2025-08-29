// src/events/events.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/modules/user/api/user.service';
import { Brackets, LessThan, Not, Repository } from 'typeorm';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { Event } from 'src/common/models/types/event.entity';
import { EventStatus } from 'src/common/enum/eventStatus.enum';
import { NotificationService } from 'src/modules/notification/api/notification.service';
import { MailService } from 'src/modules/mail/mail.service';
import { Participant } from 'src/common/models/types/participant.entity';
import { GoogleSheetsService } from 'src/modules/googlesheet/api/googleSheet.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,

    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
    private readonly googleSheetsService: GoogleSheetsService,
  ) {}

  async create(createEventDto: CreateEventDto, userId: string): Promise<Event> {
    const organisateur = await this.userService.findOne(userId);

  // Si un sheetId est fourni dans le DTO, on vérifie qu'il existe
  if (createEventDto.sheetId) {
    // Vous pouvez ajouter ici une validation du sheetId avec le GoogleSheetsService
    try {
      await this.googleSheetsService.getResponses(createEventDto.sheetId);
    } catch (error) {
      throw new Error('Invalid Google Sheet ID');
    }
  }
    if (!organisateur) {
      throw new NotFoundException('Organisateur non trouvé');
    }

    const invitedIds = Array.isArray(createEventDto.invitedIds) ? createEventDto.invitedIds : [];

    const event = this.eventRepository.create({
      ...createEventDto,
      isPrivate: createEventDto.isPrivate,
      invitedIds,
      organisateur,
    });

    const savedEvent = await this.eventRepository.save(event);

    this.eventEmitter.emit('event.created', {
      eventId: savedEvent.id,
      titre: savedEvent.titre,
    });

   if (createEventDto.isPrivate === true && invitedIds.length > 0) {
  // Envoi uniquement aux invités, notifications privées
  const invitedUsers = (await this.userService.findManyByIds(invitedIds)).filter(Boolean);


  for (const user of invitedUsers) {
    await this.mailService.sendMail(
      user.email,
      `Invitation privée : ${savedEvent.titre}`,
      `Bonjour ${user.nom}, vous êtes invité à un événement privé : ${savedEvent.titre}`,
      `<p>Bonjour ${user.nom},</p>
       <p>Vous êtes invité à l'événement privé suivant :</p>
       <ul>
         <li><strong>Titre :</strong> ${savedEvent.titre}</li>
         <li><strong>Description :</strong> ${savedEvent.description}</li>
         <li><strong>Date :</strong> ${savedEvent.date} à ${savedEvent.heure}</li>
         <li><strong>Lieu :</strong> ${savedEvent.lieu}</li>
       </ul>
       <p>Merci de consulter TeamwillEvents pour plus d’informations et confirmer votre présence.</p>`
    );

    await this.notificationService.create(
      user.id,
      `Vous êtes invité à l'événement privé : ${savedEvent.titre}`,
      'event',
      { eventId: savedEvent.id },
    );
  }
} else if (createEventDto.isPrivate === true && invitedIds.length === 0) {
  // Événement privé sans invités = aucun mail / notification publique envoyés
  console.log('Événement privé sans invités : pas d\'envoi de mail ni notification publique.');
} else {
  // Événement public = notification & mail à tous sauf organisateur
  const usersToNotify = await this.userService.findAllExceptUser(userId);

  for (const user of usersToNotify) {
    await this.mailService.sendMail(
      user.email,
      `Nouvel événement publié : ${savedEvent.titre}`,
      `Bonjour ${user.nom}, un nouvel événement public a été publié : ${savedEvent.titre}`,
      `<p>Bonjour ${user.nom},</p>
       <p>Un nouvel événement public a été publié :</p>
       <ul>
         <li><strong>Titre :</strong> ${savedEvent.titre}</li>
         <li><strong>Description :</strong> ${savedEvent.description}</li>
         <li><strong>Date :</strong> ${savedEvent.date} à ${savedEvent.heure}</li>
         <li><strong>Lieu :</strong> ${savedEvent.lieu}</li>
       </ul>
       <p>Merci de consulter TeamwillEvents pour plus d’informations et vous inscrire.</p>`
    );

    await this.notificationService.create(
      user.id,
      `Nouvel événement publié : ${savedEvent.titre}`,
      'event',
      { eventId: savedEvent.id },
    );
  }
}


    return savedEvent;
  }
  async addParticipantToEvent(eventId: string, userId: string, addedById: string): Promise<void> {
  const event = await this.findOne(eventId);
  const userToAdd = await this.userService.findOne(userId);
  const addedBy = await this.userService.findOne(addedById);

  if (!event) throw new NotFoundException('Événement non trouvé');
  if (!userToAdd) throw new NotFoundException('Utilisateur à ajouter non trouvé');
  if (!addedBy) throw new NotFoundException('Utilisateur ayant initié l\'action non trouvé');

  // Vérifie si déjà participant
  const existing = await this.participantRepository.findOne({
    where: { user: { id: userId }, event: { id: eventId } },
    relations: ['user', 'event'],
  });
  if (existing) {
    throw new Error('Utilisateur déjà participant à cet événement');
  }

  const participant = this.participantRepository.create({
    user: userToAdd,
    event,
  });
  await this.participantRepository.save(participant);

  // Envoi mail
  await this.mailService.sendMail(
    userToAdd.email,
    `Ajout à un événement : ${event.titre}`,
    `Bonjour ${userToAdd.nom}, ${addedBy.nom} vous a ajouté à l'événement : ${event.titre}`,
    `<p>Bonjour ${userToAdd.nom},</p>
    <p>${addedBy.nom} vous a ajouté en tant que participant à l'événement suivant :</p>
    <ul>
      <li><strong>Titre :</strong> ${event.titre}</li>
      <li><strong>Description :</strong> ${event.description}</li>
      <li><strong>Date :</strong> ${event.date} à ${event.heure}</li>
      <li><strong>Lieu :</strong> ${event.lieu}</li>
    </ul>
    <p>Merci de consulter TeamwillEvents pour plus d’informations.</p>`
  );

  // Envoi notification
  await this.notificationService.create(
    userToAdd.id,
    `${addedBy.nom} vous a ajouté à l'événement : ${event.titre}`,
    'event',
    { eventId: event.id },
  );
}


  async findAll(userId: string): Promise<Event[]> {
    const now = new Date();
    const nowStr = now.toISOString();

    await this.eventRepository.update(
      {
        date: LessThan(nowStr),
        status: Not(EventStatus.DONE),
      },
      {
        status: EventStatus.DONE,
      },
    );

    const events = await this.eventRepository
  .createQueryBuilder('event')
  .leftJoinAndSelect('event.organisateur', 'organisateur')
  .leftJoinAndSelect('event.participants', 'participant')
  .leftJoinAndSelect('participant.user', 'participantUser')
  .where(new Brackets(qb => {
    qb.where('event.isPrivate = false')                            // publics
      .orWhere(':userId = ANY(event.invitedIds)', { userId })      // invités
      .orWhere('organisateur.id = :userId', { userId })            // *** organisateur ***
  }))
  .orderBy('event.date', 'ASC')
  .getMany();

    return events;
  }

  async findOne(id: string): Promise<Event> {
    await this.updateEventStatusIfNeeded(id);
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['participants', 'organisateur'],
    });

    if (!event) {
      throw new NotFoundException('Événement non trouvé');
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);
    if (!event) throw new Error('Event not found');
    
    const oldStatus = event.status;
    const oldSheetId = event.sheetId;
    
    Object.assign(event, updateEventDto);
    
    // Si le sheetId a changé, on vérifie que le nouveau est valide
    if (updateEventDto.sheetId !== undefined && updateEventDto.sheetId !== oldSheetId) {
      if (updateEventDto.sheetId !== null) {
        try {
          await this.googleSheetsService.getResponses(updateEventDto.sheetId);
        } catch (error) {
          throw new Error('Invalid Google Sheet ID');
        }
      }
    }
    const updatedEvent = await this.eventRepository.save(event);

    // Si le statut a changé pour CANCELLED
    if (oldStatus !== EventStatus.CANCELLED && event.status === EventStatus.CANCELLED) {
      // Récupérer tous les participants
      const participants = await this.participantRepository.find({
        where: { event: { id: event.id } },
        relations: ['user']
      });

      // Envoyer un mail et une notification à chaque participant
      for (const participant of participants) {
        if (participant.user && participant.user.email) {
          // Envoyer l'email
          await this.mailService.sendMail(
            participant.user.email,
            `Événement annulé : ${event.titre}`,
            `Bonjour ${participant.user.nom},\n\nL'événement "${event.titre}" auquel vous étiez inscrit(e) a été annulé.\n\nDétails de l'événement :\nDate : ${new Date(event.date).toLocaleString()}\nLieu : ${event.lieu}\n\nNous vous prions de nous excuser pour ce désagrément.`,
            `<p>Bonjour ${participant.user.nom},</p>\n             <p>L'événement <strong>"${event.titre}"</strong> auquel vous étiez inscrit(e) a été annulé.</p>\n             <h3>Détails de l'événement :</h3>\n             <ul>\n               <li><strong>Date :</strong> ${new Date(event.date).toLocaleString()}</li>\n               <li><strong>Lieu :</strong> ${event.lieu}</li>\n               ${event.description ? `<li><strong>Description :</strong> ${event.description}</li>` : ''}\n             </ul>\n             <p>Nous vous prions de nous excuser pour ce désagrément.</p>`
          );

          // Créer une notification
          await this.notificationService.create(
            participant.user.id,
            `L'événement "${event.titre}" a été annulé`,
            'event',
            { eventId: event.id }
          );
        }
      }
    }

    return updatedEvent;
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.eventRepository.remove(event);
  }

  async updateEventStatusIfNeeded(eventId: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) throw new NotFoundException("Événement introuvable");

    const now = new Date();
    const eventDateTime = new Date(`${event.date}T${event.heure}`);

    if (now >= eventDateTime && event.status !== EventStatus.DONE) {
      event.status = EventStatus.DONE;
      return await this.eventRepository.save(event);
    }

    if (now < eventDateTime && event.status !== EventStatus.PUBLISHED) {
      event.status = EventStatus.PUBLISHED;
      return await this.eventRepository.save(event);
    }

    return event;
  }

  async deleteEventImage(id: string): Promise<void> {
    const event = await this.findOne(id);
    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }

    // Si l'événement n'a pas d'image, on retourne simplement
    if (!event.imageUrl) {
      return;
    }

    // On met à jour l'événement en supprimant l'image
    event.imageUrl = null;
    await this.eventRepository.save(event);
  }
}
