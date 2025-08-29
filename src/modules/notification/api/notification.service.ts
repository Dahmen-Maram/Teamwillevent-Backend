// src/modules/notification/notification.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from 'src/common/models/types/notification.entity';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  async create(userId: string, title: string, type?: 'event' | 'message', payload?: { eventId?: string; messageId?: string }) {
    const notif = this.notifRepo.create({
      userId,
      title,
      // Tu peux étendre avec type, eventId, messageId si ajoutés à l'entité
      ...payload,
    });

    return this.notifRepo.save(notif);
  }
  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.notifRepo.findOne({
      where: { id, userId }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notifRepo.remove(notification);
  }
  async markAllAsRead(userId: string): Promise<void> {
    await this.notifRepo.update({ userId }, { isRead: true });
  }

  async markOneAsRead(notifId: string): Promise<void> {
    const notif = await this.notifRepo.findOneBy({ id: notifId });
    if (!notif) throw new NotFoundException('Notification non trouvée');
    notif.isRead = true;
    await this.notifRepo.save(notif);
  }

  async findForUser(userId: string): Promise<Notification[]> {
    return this.notifRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.notifRepo.count({
      where: { userId, isRead: false },
    });
  }
  async findAll(): Promise<Notification[]> {
    return this.notifRepo.find({
      order: { createdAt: 'DESC' },
    });
  }
}
