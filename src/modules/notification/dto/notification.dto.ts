// src/modules/notification/dto/notification.dto.ts

export class NotificationDto {
  id: string;
  type: 'event' | 'message'| 'task' | 'other';
  eventId?: string;
  messageId?: string;
  title: string;
  isRead: boolean;
  createdAt: Date;
}
