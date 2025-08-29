import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from 'src/common/models/types/message.entity';
import { User } from 'src/common/models/types/user.entity';
import { Event } from 'src/common/models/types/event.entity';
import { Participant } from 'src/common/models/types/participant.entity';
import { NotificationService } from 'src/modules/notification/api/notification.service';


@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,

    @InjectRepository(Participant)
    private readonly participantRepo: Repository<Participant>,
     private readonly notificationService: NotificationService,
  ) {}

 async saveMessage(
  userId: string,
  eventId: string,
  content: string,
  mediaUrl?: string,
): Promise<Message> {
  const user = await this.userRepo.findOne({ where: { id: userId } });
  if (!user) {
    throw new NotFoundException('Utilisateur introuvable');
  }

  const event = await this.eventRepo.findOne({ where: { id: eventId } });
  if (!event) {
    throw new NotFoundException('Événement introuvable');
  }

  const message = this.messageRepo.create({
    content,
    mediaUrl,
    sender: user,
    event,
  });

  const savedMessage = await this.messageRepo.save(message);

  // Notifier tous les participants sauf l'émetteur
  const participants = await this.participantRepo.find({
    where: { event: { id: eventId } },
    relations: ['user'],
  });

  for (const participant of participants) {
    if (participant.user.id !== userId) {
      await this.notificationService.create(
        participant.user.id,
        `Nouveau message dans l'événement ${event.titre}`,
        'message',
        { eventId, messageId: savedMessage.id },
      );
    }
  }

  return savedMessage;
}
// chat.service.ts
async findUserByName(nom: string) {
  return this.userRepo.createQueryBuilder('user')
    .where('LOWER(user.nom) LIKE LOWER(:nom)', { nom: `%${nom}%` })
    .getOne();
}


  


  async isParticipant(userId: string, eventId: string): Promise<boolean> {
    const count = await this.participantRepo.count({
      where: {
        user: { id: userId },
        event: { id: eventId },

      },
    });
    return count > 0;
  }
  // (1) Marquer comme vu
async markAsSeen(messageId: string, userId: string): Promise<void> {
  const message = await this.messageRepo.findOne({ where: { id: messageId } });
  if (!message) throw new NotFoundException('Message non trouvé');

  if (!message.seenBy.includes(userId)) {
    message.seenBy.push(userId);
    await this.messageRepo.save(message);
  }
}

// (2) Supprimer pour moi
async deleteForMe(messageId: string, userId: string): Promise<void> {
  const message = await this.messageRepo.findOne({ where: { id: messageId } });
  if (!message) throw new NotFoundException('Message non trouvé');

  if (!message.deletedForUserIds.includes(userId)) {
    message.deletedForUserIds.push(userId);
    await this.messageRepo.save(message);
  }
}

async countAll() {
  const count = await this.messageRepo.count();
  return { count };
}
// (3) Supprimer pour tous
async deleteForAll(messageId: string): Promise<void> {
  const message = await this.messageRepo.findOne({ where: { id: messageId } });
  if (!message) throw new NotFoundException('Message non trouvé');

  message.deletedForAll = true;
  await this.messageRepo.save(message);
}

// (4) Filtrer les messages visibles
async getMessagesForEvent(eventId: string, userId: string): Promise<Message[]> {
  const messages = await this.messageRepo.find({
    where: { event: { id: eventId } },
    relations: ['sender'],
    order: { timestamp: 'ASC' },
  });

  // ✅ filtrage soft-delete
  return messages.filter(
    m => !m.deletedForAll && !m.deletedForUserIds.includes(userId),
  );
}

}
