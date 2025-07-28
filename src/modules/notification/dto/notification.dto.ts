// src/modules/notification/dto/notification.dto.ts

export class NotificationDto {
  id: string;
  type: 'event' | 'message';
  eventId?: string;
  messageId?: string;
  title: string;
  isRead: boolean;
  createdAt: Date;
}
